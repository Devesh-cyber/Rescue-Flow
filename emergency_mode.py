"""
emergency_mode.py

Production-ready Emergency Mode module for Deadline Rescue.
Analyzes execution plan, progress, and deadline to produce a recovery strategy.
Does NOT generate solutions.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
from bson.objectid import ObjectId
import logging

from database.task_repository import TaskRepository

logger = logging.getLogger(__name__)


class EmergencyModeAgent:
    """
    Emergency Mode Engine that analyzes a task's progress against its deadline 
    to provide a recovery strategy.
    """

    # ======================================================
    # Private Helper Methods
    # ======================================================

    def _utc_now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _get_all_steps(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Return a list of all steps in execution order.
        Handles both dictionary and list formats for execution_plan.
        """
        steps = []
        execution_plan = task.get("execution_plan")
        if not execution_plan:
            return steps

        phases = []
        if isinstance(execution_plan, dict):
            phases = execution_plan.get("phases", [])
        elif isinstance(execution_plan, list):
            phases = execution_plan

        for phase in phases:
            if isinstance(phase, dict):
                for step in phase.get("steps", []):
                    if isinstance(step, dict):
                        steps.append(step)
        return steps

    def _get_all_incomplete_steps(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Return a list of all incomplete steps in execution order.
        """
        return [s for s in self._get_all_steps(task) if s.get("status") != "Completed"]
        
    def _get_completed_step_ids(self, task: Dict[str, Any]) -> set[str]:
        """
        Return a set of IDs for all completed steps.
        """
        return {s.get("step_id") for s in self._get_all_steps(task) if s.get("status") == "Completed" and s.get("step_id")}

    def _calculate_time_saved(self, task: Dict[str, Any], skippable_steps: List[str]) -> float:
        """
        Calculate the total estimated hours for the steps that will be skipped.
        """
        time_saved = 0.0
        for step in self._get_all_incomplete_steps(task):
            if step.get("step_id") in skippable_steps:
                time_saved += float(step.get("estimated_hours", 0.0))
        return time_saved

    def _get_priority_weight(self, priority: str) -> int:
        """
        Assign numerical weights for sorting by priority.
        Lower number means higher priority.
        """
        priority = priority.lower()
        if priority == "mandatory":
            return 1
        elif priority == "recommended":
            return 2
        elif priority == "optional":
            return 3
        return 4

    def _generate_recommended_work_order(self, task: Dict[str, Any]) -> List[str]:
        """
        Sort incomplete steps by dependencies, emergency priority, and execution order.
        For simplicity, we assume the original execution plan list order handles dependencies naturally.
        We just need to stably sort by priority (Mandatory -> Recommended -> Optional).
        """
        incomplete_steps = self._get_all_incomplete_steps(task)

        # Sort based on priority weight. Python's sort is stable, preserving execution order for ties.
        incomplete_steps.sort(key=lambda x: self._get_priority_weight(str(x.get("emergency_priority", ""))))

        return [step.get("step_id", "") for step in incomplete_steps if step.get("step_id")]

    # ======================================================
    # Public API Methods
    # ======================================================

    def load_task(self, task_id: str) -> Dict[str, Any]:
        """
        Load task from MongoDB using TaskRepository.
        """
        try:
            obj_id = ObjectId(task_id)
        except Exception:
            raise ValueError(f"Invalid task ID format: '{task_id}'.")
            
        task = TaskRepository.get_task(obj_id)
        if not task:
            raise ValueError(f"Task '{task_id}' not found.")
        return task

    def calculate_remaining_time(self, task: Dict[str, Any]) -> Tuple[int, int, bool]:
        """
        Return remaining days, remaining hours, and an overdue flag based on the deadline.
        Gracefully handles missing or invalid deadlines.
        """
        analysis = task.get("analysis", {})
        if not analysis:
            return 0, 0, False

        deadline_str = analysis.get("deadline")
        if not deadline_str:
            return 0, 0, False

        try:
            # Assuming ISO 8601 string, e.g., '2026-06-30T12:00:00Z'
            if deadline_str.endswith('Z'):
                deadline_str = deadline_str[:-1] + '+00:00'
            deadline = datetime.fromisoformat(deadline_str)
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            # Handle invalid date formats gracefully
            return 0, 0, False

        now = self._utc_now()
        time_left = deadline - now

        if time_left.total_seconds() < 0:
            return 0, 0, True

        days = time_left.days
        hours = int(time_left.total_seconds() / 3600)
        return days, hours, False

    def calculate_workload(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate remaining steps and estimated hours categorized by priority.
        """
        remaining_steps = 0
        mandatory_remaining = 0
        recommended_remaining = 0
        optional_remaining = 0
        remaining_hours = 0.0

        for step in self._get_all_incomplete_steps(task):
            remaining_steps += 1
            remaining_hours += float(step.get("estimated_hours", 0.0))
            
            priority = str(step.get("emergency_priority", "")).lower()
            if priority == "mandatory":
                mandatory_remaining += 1
            elif priority == "recommended":
                recommended_remaining += 1
            elif priority == "optional":
                optional_remaining += 1
            else:
                # Default to mandatory if not specified
                mandatory_remaining += 1

        return {
            "remaining_steps": remaining_steps,
            "mandatory_steps_remaining": mandatory_remaining,
            "recommended_steps_remaining": recommended_remaining,
            "optional_steps_remaining": optional_remaining,
            "remaining_estimated_hours": remaining_hours
        }

    def determine_risk_level(self, remaining_hours: int, remaining_estimated_hours: float, is_overdue: bool, completion_percentage: float) -> str:
        """
        Determine risk level using the heuristic considering remaining hours, workload, completion %, and proximity.
        Safe: remaining >= 1.5x estimated AND completion > 25% (or early stages)
        Warning: remaining >= estimated
        Critical: remaining < estimated, overdue, or deadline proximity < 24h with low completion
        """
        if is_overdue or remaining_hours < remaining_estimated_hours:
            return "Critical"
            
        if remaining_hours < 24 and completion_percentage < 75:
            return "Critical"
            
        if remaining_hours >= (remaining_estimated_hours * 1.5) and remaining_hours > 24:
            return "Safe"
            
        return "Warning"

    def find_skippable_steps(self, task: Dict[str, Any]) -> List[str]:
        """
        Return only Optional and Recommended steps that are not yet completed.
        Never skip Mandatory steps.
        """
        skippable: List[str] = []
        for step in self._get_all_incomplete_steps(task):
            priority = str(step.get("emergency_priority", "")).lower()
            if priority in ("optional", "recommended"):
                step_id = step.get("step_id")
                if step_id:
                    skippable.append(step_id)
        return skippable

    def generate_recovery_plan(self, task: Dict[str, Any], skippable_steps: List[str]) -> List[str]:
        """
        Produce a list of recommendations, always listing mandatory work first (Finish),
        then skipped work (Skip).
        """
        recommendations = []
        focus_steps = []
        skip_steps = []

        for step in self._get_all_incomplete_steps(task):
            step_id = step.get("step_id")
            title = step.get("title", step_id)
            
            if step_id in skippable_steps:
                skip_steps.append(f"Skip: {title}")
            else:
                focus_steps.append(f"Finish: {title}")

        # Finish steps first, then skips
        recommendations.extend(focus_steps)
        recommendations.extend(skip_steps)
        
        return recommendations

    def should_generate_solution(self, remaining_hours: int, remaining_steps: int) -> bool:
        """
        Return True ONLY IF remaining time < 24 hours AND there is unfinished work.
        """
        return remaining_hours < 24 and remaining_steps > 0

    def update_emergency_mode(self, task_id: str) -> None:
        """
        Save emergency analysis into MongoDB via TaskRepository.
        """
        task = self.load_task(task_id)
        
        # Calculate times
        days, hours, is_overdue = self.calculate_remaining_time(task)
        if is_overdue:
            hours = 0
            
        # Calculate workload
        workload = self.calculate_workload(task)
        
        # Get overall completion
        overall_completion = task.get("progress", {}).get("overall_completion", 0)

        # Risk assessment
        risk_level = self.determine_risk_level(hours, workload["remaining_estimated_hours"], is_overdue, overall_completion)
        
        # Identify skippable steps
        skippable_steps = self.find_skippable_steps(task)
        time_saved = self._calculate_time_saved(task, skippable_steps)
        
        # Focus Steps and Recommended Order
        recommended_order = self._generate_recommended_work_order(task)
        
        completed_step_ids = self._get_completed_step_ids(task)
        step_deps = {
            s.get("step_id"): s.get("dependencies", []) 
            for s in self._get_all_steps(task) 
            if s.get("step_id")
        }
        
        focus_steps = []
        for step_id in recommended_order:
            deps = step_deps.get(step_id, [])
            if all(d in completed_step_ids for d in deps):
                focus_steps.append(step_id)
        
        # Generate recovery plan
        recovery_plan = self.generate_recovery_plan(task, skippable_steps)
        
        # Final decision
        generate_solution = self.should_generate_solution(hours, workload["remaining_steps"])

        # Build schema
        emergency_mode_data = {
            "enabled": True,
            "mode": risk_level,
            "risk_level": risk_level,
            "is_overdue": is_overdue,
            "remaining_days": days,
            "remaining_hours": hours,
            "remaining_estimated_hours": workload["remaining_estimated_hours"],
            "estimated_time_saved": time_saved,
            "overall_completion": overall_completion,
            "mandatory_steps_remaining": workload["mandatory_steps_remaining"],
            "recommended_steps_remaining": workload["recommended_steps_remaining"],
            "optional_steps_remaining": workload["optional_steps_remaining"],
            "steps_to_skip": skippable_steps,
            "focus_steps": focus_steps,
            "recommended_work_order": recommended_order,
            "recovery_plan": recovery_plan,
            "generate_solution": generate_solution,
            "last_updated": self._utc_now().replace(microsecond=0).isoformat()
        }

        # Update via TaskRepository
        TaskRepository.update_emergency_mode(task.get("_id") or ObjectId(task_id), emergency_mode_data)
        logger.info(f"Emergency mode updated for task {task_id}")
