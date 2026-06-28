"""
services/execution_service.py

Central execution engine for Deadline Rescue.
Manages workflow state, integrates with ProgressTracker and EmergencyMode.
"""
import os
import sys
PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)
sys.path.insert(0, PROJECT_ROOT)

import logging
from typing import Any, Dict, List, Tuple
from bson import ObjectId

from database.task_repository import TaskRepository
from progress_tracker import ProgressTrackerAgent
from emergency_mode import EmergencyModeAgent

logger = logging.getLogger(__name__)

class ExecutionServiceError(Exception):
    """Base exception for ExecutionService."""
    pass

class TaskNotFoundError(ExecutionServiceError):
    """Raised when the task cannot be found."""
    pass

class StepNotFoundError(ExecutionServiceError):
    """Raised when a step does not exist."""
    pass

class DependencyViolationError(ExecutionServiceError):
    """Raised when dependencies are not met."""
    pass

class InvalidStatusTransitionError(ExecutionServiceError):
    """Raised when an invalid status transition is attempted."""
    pass

class ExecutionService:
    """
    Central execution engine that manages task execution state.
    """

    def load_task(self, task_id: str) -> Dict[str, Any]:
        """Load a task from MongoDB."""
        try:
            obj_id = ObjectId(task_id)
        except Exception as exc:
            logger.error(f"Invalid task ID format: {task_id}")
            raise ValueError(f"Invalid task ID format: {task_id}") from exc
            
        task_document = TaskRepository.get_task(obj_id)
        if not task_document:
            logger.error(f"Task not found: {task_id}")
            raise TaskNotFoundError(f"Task '{task_id}' not found.")
            
        logger.info(f"Task loaded: {task_id}")
        return task_document

    def find_step(self, execution_plan: Dict[str, Any], step_id: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Locate a step inside the execution plan."""
        phases = execution_plan.get("phases", [])
        for phase in phases:
            for step in phase.get("steps", []):
                if step.get("step_id") == step_id:
                    return phase, step
        
        logger.error(f"Step '{step_id}' not found in execution plan.")
        raise StepNotFoundError(f"Step '{step_id}' not found.")

    def get_step_context(self, task_id: str, step_id: str) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
        """Helper to get task, execution_plan, phase, and step."""
        task = self.load_task(task_id)
        execution_plan = task.get("execution_plan", {})
        phase, step = self.find_step(execution_plan, step_id)
        return task, execution_plan, phase, step

    def validate_dependencies(self, task: Dict[str, Any], step: Dict[str, Any]) -> None:
        """Ensure a step cannot start until dependencies are completed."""
        dependencies = step.get("dependencies", [])
        if not dependencies:
            return

        execution_plan = task.get("execution_plan", {})
        
        # Build a lookup for quick status checking
        completed_steps = set()
        for phase in execution_plan.get("phases", []):
            for s in phase.get("steps", []):
                if s.get("status") == "Completed":
                    completed_steps.add(s.get("step_id"))
                    
        for dep in dependencies:
            if dep not in completed_steps:
                logger.error(f"Dependency validation failure: '{dep}' not completed for step '{step.get('step_id')}'.")
                raise DependencyViolationError(f"Dependency '{dep}' is not completed.")

    def _update_and_recalculate(
    self,
    task_id: str,
    execution_plan: Dict[str, Any]
) -> Dict[str, Any]:
        """
        Persist execution plan, recalculate progress,
        recalculate emergency mode, update task status,
        and return the latest task state.
        """

        try:
            obj_id = ObjectId(task_id)

            # --------------------------------------------------
            # 1. Persist execution plan
            # --------------------------------------------------

            TaskRepository.update_execution_plan(
                obj_id,
                execution_plan
            )

            logger.info(
                "MongoDB updated successfully for execution_plan"
            )

            # --------------------------------------------------
            # 2. Recalculate progress
            # --------------------------------------------------

            ProgressTrackerAgent().update_progress(
                task_id
            )

            logger.info(
                "Progress recalculated"
            )

            # --------------------------------------------------
            # 3. Recalculate emergency mode
            # --------------------------------------------------

            EmergencyModeAgent().update_emergency_mode(
                task_id
            )

            logger.info(
                "Emergency mode recalculated"
            )

            # --------------------------------------------------
            # 4. Reload latest task state
            # --------------------------------------------------

            task = self.load_task(task_id)

            execution_plan = task.get(
                "execution_plan",
                {}
            )

            # --------------------------------------------------
            # 5. Determine task status
            # --------------------------------------------------

            has_started = False
            all_completed = True

            for phase in execution_plan.get(
                "phases",
                []
            ):
                for step in phase.get(
                    "steps",
                    []
                ):

                    step_status = step.get(
                        "status",
                        "Pending"
                    )

                    if step_status in (
                        "In Progress",
                        "Completed"
                    ):
                        has_started = True

                    if step_status != "Completed":
                        all_completed = False

            if all_completed:
                status = "completed"

            elif has_started:
                status = "in_progress"

            else:
                status = "planned"

            # --------------------------------------------------
            # 6. Persist completed_at
            # --------------------------------------------------

            if status == "completed":

                from datetime import (
                    datetime,
                    timezone
                )

                if not task.get(
                    "completed_at"
                ):

                    completed_at = (
                        datetime.now(
                            timezone.utc
                        )
                        .replace(
                            microsecond=0
                        )
                        .isoformat()
                    )

                    TaskRepository.update_completed_at(task_id)

                    logger.info(
                        "completed_at set"
                    )

            # --------------------------------------------------
            # 7. Persist task status
            # --------------------------------------------------

            TaskRepository.update_status(
                obj_id,
                status
            )

            logger.info(
                f"Task status updated to {status}"
            )

            # --------------------------------------------------
            # 8. Return latest version
            # --------------------------------------------------

            updated_task = self.load_task(
                task_id
            )

            return updated_task

        except Exception as exc:

            logger.exception(
                "Failed to update and recalculate task state."
            )

            raise ExecutionServiceError(
                str(exc)
            ) from exc

    def start_step(self, task_id: str, step_id: str) -> Dict[str, Any]:
        """Move step into active work."""
        task, execution_plan, phase, step = self.get_step_context(task_id, step_id)
        
        current_status = step.get("status", "Pending")
        if current_status != "Pending":
            logger.error(f"Status transition failure: Invalid status transition: {current_status} -> In Progress for {step_id}")
            raise InvalidStatusTransitionError(f"Cannot start step '{step_id}' from status '{current_status}'.")
            
        try:
            self.validate_dependencies(task, step)
        except DependencyViolationError:
            raise
            
        step["status"] = "In Progress"
        logger.info(f"Step started: {step_id}")
        
        return self._update_and_recalculate(task_id, execution_plan)

    def complete_step(self, task_id: str, step_id: str) -> Dict[str, Any]:
        """Mark a step completed."""
        task, execution_plan, phase, step = self.get_step_context(task_id, step_id)
        
        current_status = step.get("status", "Pending")
        if current_status not in ("Pending", "In Progress"):
            logger.error(f"Status transition failure: Invalid status transition: {current_status} -> Completed for {step_id}")
            raise InvalidStatusTransitionError(f"Cannot complete step '{step_id}' from status '{current_status}'.")
            
        try:
            self.validate_dependencies(task, step)
        except DependencyViolationError:
            raise
            
        step["status"] = "Completed"
        logger.info(f"Step completed: {step_id}")
        
        return self._update_and_recalculate(task_id, execution_plan)

    def reopen_step(self, task_id: str, step_id: str) -> Dict[str, Any]:
        """Undo completion."""
        task, execution_plan, phase, step = self.get_step_context(task_id, step_id)
        
        current_status = step.get("status", "Pending")
        if current_status != "Completed":
            logger.error(f"Status transition failure: Invalid status transition for reopen: {current_status} -> Pending for {step_id}")
            raise InvalidStatusTransitionError(f"Cannot reopen a step that is not completed.")
            
        # Check downstream dependencies
        for p in execution_plan.get("phases", []):
            for s in p.get("steps", []):
                if s.get("status") == "Completed" and step_id in s.get("dependencies", []):
                    logger.error(f"Dependency validation failure: Completed downstream step '{s.get('step_id')}' depends on '{step_id}'.")
                    raise DependencyViolationError("Cannot reopen step because completed downstream steps depend on it.")
            
        step["status"] = "Pending"
        logger.info(f"Step reopened: {step_id}")
        
        return self._update_and_recalculate(task_id, execution_plan)

    def get_dashboard(
        self,
        task_id: str
    ) -> Dict[str, Any]:

        task = self.load_task(task_id)

        analysis = task.get("analysis", {})

        return {
            "task_id": str(task["_id"]),
            "analysis": analysis,
            "title": analysis.get("title"),
            "deadline": analysis.get("deadline"),
            "progress": task.get("progress", {}),
            "emergency_mode": task.get("emergency_mode", {}),
            "status": task.get("status")
        }

    def get_task_summary(
        self,
        task_id: str
    ) -> Dict[str, Any]:

        task = self.load_task(task_id)

        return {
            "task_id": str(task["_id"]),
            "title": task.get("analysis", {}).get("title"),
            "status": task.get("status"),
            "overall_completion":
                task.get("progress", {}).get(
                    "overall_completion", 0
                ),
            "risk_level":
                task.get("emergency_mode", {}).get(
                    "risk_level"
                )
        }