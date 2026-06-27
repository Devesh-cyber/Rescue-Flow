"""
tests/test_integration.py

Integration tests for ExecutionService, ProgressTracker, EmergencyMode, and TaskRepository.
"""
import os
import sys
PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)
sys.path.insert(0, PROJECT_ROOT)

import unittest
import logging
from database.task_repository import TaskRepository
from database.database import tasks
from services.execution_service import ExecutionService, DependencyViolationError, InvalidStatusTransitionError
from progress_tracker import ProgressTrackerAgent
from emergency_mode import EmergencyModeAgent

logging.basicConfig(level=logging.ERROR)

class TestBackendIntegration(unittest.TestCase):
    def setUp(self):
        # Create a mock task
        mock_task = {
            "source_type": "test",
            "source_name": "execution_service_test",
            "content": "Execution Service Integration Test",
            "timestamp": "2030-01-01T00:00:00Z",
            "extracted_by": "unit_test",
            "status": "created"
        }
        self.task_id = TaskRepository.create_task(mock_task)
        
        # Add a mock execution plan
        mock_plan = {
            "phases": [
                {
                    "phase_no": 1,
                    "title": "Phase 1",
                    "completion_percentage": 0,
                    "steps": [
                        {
                            "step_id": "P1-S1",
                            "status": "Pending",
                            "dependencies": [],
                            "estimated_hours": 2,
                            "emergency_priority": "Mandatory"
                        },
                        {
                            "step_id": "P1-S2",
                            "status": "Pending",
                            "dependencies": ["P1-S1"],
                            "estimated_hours": 3,
                            "emergency_priority": "Recommended"
                        }
                    ]
                }
            ]
        }
        
        TaskRepository.update_execution(self.task_id, mock_plan)
        self.service = ExecutionService()
        
        # Initialize
        ProgressTrackerAgent().initialize_progress(str(self.task_id))
        EmergencyModeAgent().update_emergency_mode(str(self.task_id))
        
    def tearDown(self):
        # Cleanup
        tasks.delete_one({"_id": self.task_id})
        
    def test_dependency_validation(self):
        # Trying to start P1-S2 before P1-S1 is completed should raise DependencyViolationError
        with self.assertRaises(DependencyViolationError):
            self.service.start_step(str(self.task_id), "P1-S2")
            
    def test_progress_recalculation_and_status_transitions(self):
        # Pending -> In Progress
        task = self.service.start_step(str(self.task_id), "P1-S1")
        self.assertEqual(task["status"], "in_progress")
        
        # In Progress -> Completed
        task = self.service.complete_step(str(self.task_id), "P1-S1")
        
        # Check progress recalculation
        progress = task.get("progress", {})
        self.assertEqual(progress["completed_steps"], 1)
        self.assertEqual(progress["completed_hours"], 2)
        self.assertIn("P1-S2", progress["next_available_steps"])
        self.assertNotIn("P1-S1", progress["next_available_steps"])
        
        # Completed -> Pending
        task = self.service.reopen_step(str(self.task_id), "P1-S1")
        progress = task.get("progress", {})
        self.assertEqual(progress["completed_steps"], 0)
        self.assertEqual(progress["completed_hours"], 0)
        self.assertIn("P1-S1", progress["next_available_steps"])
        
    def test_invalid_transitions(self):
        # Completed -> In Progress should fail
        self.service.complete_step(str(self.task_id), "P1-S1")
        with self.assertRaises(InvalidStatusTransitionError):
            self.service.start_step(str(self.task_id), "P1-S1")
            
    def test_emergency_mode_recalculation(self):
        task = TaskRepository.get_task(self.task_id)
        em = task.get("emergency_mode", {})
        # Initially 2 steps, both incomplete
        self.assertEqual(em["mandatory_steps_remaining"], 1)
        self.assertEqual(em["recommended_steps_remaining"], 1)
        
        # Complete one step
        self.service.complete_step(str(self.task_id), "P1-S1")
        task = TaskRepository.get_task(self.task_id)
        em = task.get("emergency_mode", {})
        
        # Now 1 step remains
        self.assertEqual(em["mandatory_steps_remaining"], 0)
        self.assertEqual(em["recommended_steps_remaining"], 1)
        self.assertEqual(em["remaining_estimated_hours"], 3)

if __name__ == "__main__":
    unittest.main()
