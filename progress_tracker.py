"""
progress_tracker.py

Production-ready progress tracking module for Deadline Rescue.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId

from database.database import tasks
from database.task_repository import TaskRepository


# ==========================================================
# Exceptions
# ==========================================================

class ProgressTrackerError(Exception):
    """Base exception for ProgressTracker."""


class TaskNotFoundError(ProgressTrackerError):
    """Raised when the task cannot be found."""


class StepNotFoundError(ProgressTrackerError):
    """Raised when a step does not exist."""


class InvalidStepTransitionError(ProgressTrackerError):
    """Raised when an invalid status transition is attempted."""


# ==========================================================
# Progress Tracker
# ==========================================================

class ProgressTrackerAgent:
    """
    Maintains execution progress for Deadline Rescue tasks.

    Responsibilities
    ----------------
    - Initialize progress
    - Update step status
    - Calculate phase completion
    - Calculate overall completion
    - Unlock dependent steps
    - Persist changes to MongoDB
    """

    # ======================================================
    # Private Utility Methods
    # ======================================================

    @staticmethod
    def _utc_now() -> str:
        """
        Return the current UTC timestamp in ISO-8601 format.
        """
        return datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    def _get_task(self, task_id: str) -> Dict[str, Any]:
        """
        Retrieve a task from MongoDB.

        Args:
            task_id: MongoDB ObjectId as string.

        Returns:
            Task document.

        Raises:
            TaskNotFoundError: If the task does not exist.
        """
        try:
            obj_id = ObjectId(task_id)
        except Exception:
            raise TaskNotFoundError(f"Invalid task ID format: '{task_id}'.")

        task = tasks.find_one({"_id": obj_id})
        if task is None:
            raise TaskNotFoundError(f"Task '{task_id}' was not found.")
        return task

    @staticmethod
    def _get_execution_plan(task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Return the execution plan.

        Raises:
            ProgressTrackerError: If execution plan does not exist.
        """
        execution_plan = task.get("execution_plan")
        if not execution_plan:
            raise ProgressTrackerError("Execution plan does not exist.")
        return execution_plan

    @staticmethod
    def _get_phases(task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Return all phases from the execution plan.
        """
        return task.get("execution_plan", {}).get("phases", [])

    def _get_all_steps(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Flatten every phase into a single step list.
        """
        steps: List[Dict[str, Any]] = []
        for phase in self._get_phases(task):
            steps.extend(phase.get("steps", []))
        return steps

    def _find_step(self, task: Dict[str, Any], step_id: str) -> Dict[str, Any]:
        """
        Locate a step by ID.

        Raises:
            StepNotFoundError: If step is not found.
        """
        for step in self._get_all_steps(task):
            if step["step_id"] == step_id:
                return step
        raise StepNotFoundError(f"Step '{step_id}' does not exist.")

    def _find_phase(self, task: Dict[str, Any], step_id: str) -> Dict[str, Any]:
        """
        Return the phase containing the given step.

        Raises:
            StepNotFoundError: If phase containing the step is not found.
        """
        for phase in self._get_phases(task):
            for step in phase.get("steps", []):
                if step["step_id"] == step_id:
                    return phase
        raise StepNotFoundError(f"Phase containing '{step_id}' not found.")

    @staticmethod
    def _is_dependency_satisfied(step: Dict[str, Any], completed_step_ids: set[str]) -> bool:
        """
        Check whether all dependencies of a step have been completed.
        """
        dependencies = step.get("dependencies", [])
        return all(dependency in completed_step_ids for dependency in dependencies)

    # ======================================================
    # Unified Calculation Helpers
    # ======================================================

    def _calculate_metrics(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Single pass to calculate all aggregate metrics for progress.

        Returns:
            Dictionary containing:
            - completed_steps (int)
            - total_steps (int)
            - completed_hours (float)
            - remaining_hours (float)
            - completed_step_ids (List[str])
            - pending_step_ids (List[str])
            - overall_completion (float)
        """
        completed_steps = 0
        total_steps = 0
        completed_hours = 0.0
        remaining_hours = 0.0
        completed_step_ids: List[str] = []
        pending_step_ids: List[str] = []

        for step in self._get_all_steps(task):
            total_steps += 1
            estimated_hours = float(step.get("estimated_hours", 0.0))

            if step.get("status") == "Completed":
                completed_steps += 1
                completed_hours += estimated_hours
                completed_step_ids.append(step["step_id"])
            else:
                remaining_hours += estimated_hours
                pending_step_ids.append(step["step_id"])

        overall_completion = 0.0
        if total_steps > 0:
            overall_completion = round((completed_steps / total_steps) * 100, 2)

        return {
            "completed_steps": completed_steps,
            "total_steps": total_steps,
            "completed_hours": round(completed_hours, 2),
            "remaining_hours": round(remaining_hours, 2),
            "completed_step_ids": completed_step_ids,
            "pending_step_ids": pending_step_ids,
            "overall_completion": overall_completion,
        }

    def _build_progress_json(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Constructs the strict progress schema dictionary.
        """
        metrics = self._calculate_metrics(task)

        return {
            "overall_completion": metrics["overall_completion"],
            "completed_steps": metrics["completed_steps"],
            "remaining_steps": metrics["total_steps"] - metrics["completed_steps"],
            "current_phase": self.get_current_phase(task) or "",
            "current_step": self.get_current_step(task) or "",
            "remaining_hours": metrics["remaining_hours"],
            "completed_hours": metrics["completed_hours"],
            "completed_step_ids": metrics["completed_step_ids"],
            "pending_step_ids": metrics["pending_step_ids"],
            "next_available_steps": self.get_next_available_steps(task),
            "last_updated": self._utc_now()
        }

    # ======================================================
    # Public API Methods
    # ======================================================

    def initialize_progress(self, task_id: str) -> Dict[str, Any]:
        """
        Initialize the progress object for a task.

        Args:
            task_id: MongoDB task ID.

        Returns:
            The initialized progress dictionary.
        """
        task = self._get_task(task_id)
        self._get_execution_plan(task)

        progress = self._build_progress_json(task)

        TaskRepository.update_task_progress(
            task_id=task.get("_id", ObjectId(task_id)),
            execution_plan=task["execution_plan"],
            progress=progress
        )

        return progress

    def update_progress(self, task_id: str) -> Dict[str, Any]:
        """
        Recalculate and persist all progress metrics.

        Args:
            task_id: MongoDB task ID.

        Returns:
            Updated progress dictionary.
        """
        task = self._get_task(task_id)
        execution_plan = self._get_execution_plan(task)

        self.calculate_phase_progress(task)
        progress = self._build_progress_json(task)

        TaskRepository.update_task_progress(
            task_id=task.get("_id", ObjectId(task_id)),
            execution_plan=execution_plan,
            progress=progress
        )

        return progress

    def mark_step_in_progress(self, task_id: str, step_id: str) -> Dict[str, Any]:
        """
        Mark a step as 'In Progress'.

        The step must be Pending and have all dependencies satisfied.
        """
        task = self._get_task(task_id)
        self._get_execution_plan(task)
        step = self._find_step(task, step_id)

        if step.get("status") == "In Progress":
            return task
        if step.get("status") == "Completed":
            raise InvalidStepTransitionError(f"Step '{step_id}' is already completed and cannot be marked In Progress.")

        metrics = self._calculate_metrics(task)
        completed_ids_set = set(metrics["completed_step_ids"])

        if not self._is_dependency_satisfied(step, completed_ids_set):
            raise InvalidStepTransitionError(f"Dependencies for '{step_id}' are not satisfied.")

        step["status"] = "In Progress"
        step["started_at"] = self._utc_now()

        # Commit changes
        self.update_progress(task_id)

        return self._get_task(task_id)

    def mark_step_completed(self, task_id: str, step_id: str) -> Dict[str, Any]:
        """
        Mark a step as completed.

        The step must not already be completed and dependencies must be met.
        """
        task = self._get_task(task_id)
        self._get_execution_plan(task)
        step = self._find_step(task, step_id)

        if step.get("status") == "Completed":
            raise InvalidStepTransitionError(f"Step '{step_id}' has already been completed.")

        metrics = self._calculate_metrics(task)
        completed_ids_set = set(metrics["completed_step_ids"])

        if not self._is_dependency_satisfied(step, completed_ids_set):
            raise InvalidStepTransitionError(f"Dependencies for step '{step_id}' are not satisfied.")

        step["status"] = "Completed"
        step["completed_at"] = self._utc_now()

        # Commit changes
        self.update_progress(task_id)

        return self._get_task(task_id)

    def reset_progress(self, task_id: str) -> Dict[str, Any]:
        """
        Reset every step back to 'Pending' and clear all progress.
        """
        task = self._get_task(task_id)
        self._get_execution_plan(task)

        for phase in self._get_phases(task):
            phase["completion_percentage"] = 0
            for step in phase.get("steps", []):
                step["status"] = "Pending"
                if "started_at" in step:
                    del step["started_at"]
                if "completed_at" in step:
                    del step["completed_at"]

        return self.initialize_progress(task_id)

    def calculate_phase_progress(self, task: Dict[str, Any]) -> None:
        """
        Calculate the completion percentage for every phase.
        """
        for phase in self._get_phases(task):
            steps = phase.get("steps", [])
            total_steps = len(steps)

            if total_steps == 0:
                phase["completion_percentage"] = 0
                continue

            completed_steps = sum(1 for step in steps if step.get("status") == "Completed")
            phase["completion_percentage"] = round((completed_steps / total_steps) * 100, 2)

    def calculate_overall_progress(self, task: Dict[str, Any]) -> float:
        """
        Calculate the overall completion percentage.
        """
        metrics = self._calculate_metrics(task)
        return metrics["overall_completion"]

    def get_current_phase(self, task: Dict[str, Any]) -> Optional[str]:
        """
        Return the first phase containing unfinished work.
        """
        for phase in self._get_phases(task):
            for step in phase.get("steps", []):
                if step.get("status") != "Completed":
                    return phase.get("title")
        return None

    def get_current_step(self, task: Dict[str, Any]) -> Optional[str]:
        """
        Return the current actionable step ID.
        """
        all_steps = self._get_all_steps(task)
        
        # 1. Prefer a running step
        for step in all_steps:
            if step.get("status") == "In Progress":
                return step["step_id"]

        metrics = self._calculate_metrics(task)
        completed_ids_set = set(metrics["completed_step_ids"])

        # 2. Otherwise return first available pending step
        for step in all_steps:
            if step.get("status") == "Pending" or step.get("status") not in ("In Progress", "Completed"):
                if self._is_dependency_satisfied(step, completed_ids_set):
                    return step["step_id"]

        return None

    def get_remaining_hours(self, task: Dict[str, Any]) -> float:
        """
        Calculate remaining estimated work hours.
        """
        metrics = self._calculate_metrics(task)
        return metrics["remaining_hours"]

    def get_next_available_steps(self, task: Dict[str, Any]) -> List[str]:
        """
        Return all steps that are ready to be worked on.
        """
        metrics = self._calculate_metrics(task)
        completed_ids_set = set(metrics["completed_step_ids"])

        available_steps: List[str] = []
        for step in self._get_all_steps(task):
            if step.get("status") != "Completed":
                if self._is_dependency_satisfied(step, completed_ids_set):
                    available_steps.append(step["step_id"])

        return available_steps
