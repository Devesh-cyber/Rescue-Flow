"""
services/dashboard_service.py

DashboardService for reading task metrics and rendering a dashboard view.
This service is strictly read-only and must not modify any data in MongoDB.
"""
import os
import sys
PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)
sys.path.insert(0, PROJECT_ROOT)

import logging
from typing import Any, Dict
from bson.objectid import ObjectId

from database.task_repository import TaskRepository

logger = logging.getLogger(__name__)

class DashboardService:
    """
    Service responsible for aggregating and returning dashboard 
    information from existing MongoDB documents.
    """

    def _load_task(self, task_id: str) -> Dict[str, Any]:
        """
        Loads task from MongoDB and handles validation of task_id.
        Raises ValueError for invalid IDs and LookupError if task is not found.
        """
        try:
            obj_id = ObjectId(task_id)
        except Exception as e:
            logger.error("Invalid task id")
            raise ValueError(f"Invalid task ID format: '{task_id}'") from e
            
        task = TaskRepository.get_task(obj_id)
        if not task:
            logger.error("Task not found")
            raise LookupError(f"Task with ID '{task_id}' not found.")
            
        logger.info("Task loaded")
        return task

    def _build_task_summary(self, task: Dict[str, Any]) -> Dict[str, Any]:
        analysis = task.get("analysis", {})
        return {
            "title": analysis.get("title", ""),
            "task_type": analysis.get("task_type", ""),
            "deadline": analysis.get("deadline", ""),
            "priority": analysis.get("priority", ""),
            "difficulty": analysis.get("difficulty", ""),
            "estimated_hours": float(analysis.get("estimated_hours", 0.0)),
            "status": task.get("status", "")
        }

    def _build_progress_view(self, task: Dict[str, Any]) -> Dict[str, Any]:
        progress = task.get("progress", {})
        return {
            "overall_completion": float(progress.get("overall_completion", 0.0)),
            "completed_steps": int(progress.get("completed_steps", 0)),
            "remaining_steps": int(progress.get("remaining_steps", 0)),
            "blocked_steps": int(progress.get("blocked_steps", 0)),
            "current_phase": progress.get("current_phase", ""),
            "current_step": progress.get("current_step", ""),
            "remaining_hours": float(progress.get("remaining_hours", 0.0)),
            "completed_hours": float(progress.get("completed_hours", 0.0)),
            "next_available_steps": progress.get("next_available_steps", []),
            "last_updated": progress.get("last_updated", "")
        }

    def _build_execution_view(self, task: Dict[str, Any]) -> Dict[str, Any]:
        execution_plan = task.get("execution_plan", {})
        total_phases = 0
        total_steps = 0
        phases = execution_plan.get("phases", [])
        
        if isinstance(phases, list):
            total_phases = len(phases)
            for phase in phases:
                if isinstance(phase, dict):
                    total_steps += len(phase.get("steps", []))

        return {
            "total_phases": total_phases,
            "total_steps": total_steps,
            "critical_path": execution_plan.get("critical_path", []),
            "total_estimated_hours": float(execution_plan.get("total_estimated_hours", 0.0)),
            "phases": phases
        }

    def _build_emergency_view(self, task: Dict[str, Any]) -> Dict[str, Any]:
        em = task.get("emergency_mode", {})
        return {
            "risk_level": em.get("risk_level", ""),
            "remaining_days": int(em.get("remaining_days", 0)),
            "remaining_hours": int(em.get("remaining_hours", 0)),
            "remaining_estimated_hours": float(em.get("remaining_estimated_hours", 0.0)),
            "overall_completion": float(em.get("overall_completion", 0.0)),
            "steps_to_skip": em.get("steps_to_skip", []),
            "focus_steps": em.get("focus_steps", []),
            "recommended_work_order": em.get("recommended_work_order", []),
            "recovery_plan": em.get("recovery_plan", []),
            "generate_solution": bool(em.get("generate_solution", False))
        }

    def get_task_summary(self, task_id: str) -> Dict[str, Any]:
        """
        Returns basic summary information about the task.
        """
        task = self._load_task(task_id)
        summary = self._build_task_summary(task)
        logger.info("Task summary generated")
        return summary

    def get_progress_view(self, task_id: str) -> Dict[str, Any]:
        """
        Returns progress metrics from the task document.
        """
        task = self._load_task(task_id)
        progress_view = self._build_progress_view(task)
        # We only need the subset required by the original method, not last_updated
        progress_view.pop("last_updated", None)
        logger.info("Progress view generated")
        return progress_view

    def get_execution_view(self, task_id: str) -> Dict[str, Any]:
        """
        Returns execution plan details including dynamically calculated phase/step totals.
        """
        task = self._load_task(task_id)
        execution_view = self._build_execution_view(task)
        logger.info("Execution view generated")
        return execution_view

    def get_emergency_view(self, task_id: str) -> Dict[str, Any]:
        """
        Returns emergency mode data from the task document.
        """
        task = self._load_task(task_id)
        emergency_view = self._build_emergency_view(task)
        logger.info("Emergency view generated")
        return emergency_view

    def get_dashboard(self, task_id: str) -> Dict[str, Any]:
        """
        Returns the complete dashboard payload containing all views and a summary.
        """
        task = self._load_task(task_id)
        
        # Reuse helper methods to build the summary to avoid duplicating logic
        task_summary = self._build_task_summary(task)
        progress_view = self._build_progress_view(task)
        em_view = self._build_emergency_view(task)
        
        summary = {
            "title": task_summary.get("title", ""),
            "deadline": task_summary.get("deadline", ""),
            "overall_completion": progress_view.get("overall_completion", 0.0),
            "risk_level": em_view.get("risk_level", ""),
            "current_step": progress_view.get("current_step", ""),
            "remaining_hours": progress_view.get("remaining_hours", 0.0),
            "last_updated": progress_view.get("last_updated", "")
        }
        
        dashboard = {
            "task_id": str(task.get("_id", task_id)),
            "status": task.get("status", ""),
            "analysis": task.get("analysis", {}),
            "progress": task.get("progress", {}),
            "emergency_mode": task.get("emergency_mode", {}),
            "summary": summary
        }
        
        logger.info("Dashboard generated")
        return dashboard
