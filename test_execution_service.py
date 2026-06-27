"""
test_execution_service.py

Test script to verify ExecutionService functionality.
"""
import unittest
import logging
from database.task_repository import TaskRepository
from database.database import tasks
from services.execution_service import ExecutionService, DependencyViolationError, InvalidStatusTransitionError
from progress_tracker import ProgressTrackerAgent
from emergency_mode import EmergencyModeAgent

logging.basicConfig(level=logging.ERROR)

class TestExecutionService(unittest.TestCase):
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

        # Add analysis separately because create_task()
        # initializes analysis as None
        TaskRepository.update_analysis(
            self.task_id,
            {
                "title": "Integration Test Task",
                "deadline": "2030-01-01T12:00:00Z",
                "priority": "High"
            }
        )

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

        TaskRepository.update_execution(
            self.task_id,
            mock_plan
        )

        self.service = ExecutionService()

        # Initialize trackers
        ProgressTrackerAgent().initialize_progress(
            str(self.task_id)
        )

        EmergencyModeAgent().update_emergency_mode(
            str(self.task_id)
        )

    def tearDown(self):
        # Cleanup
        tasks.delete_one({"_id": self.task_id})
        
    def test_dependency_violation(self):
        # Trying to start P1-S2 before P1-S1 is completed should raise DependencyViolationError
        with self.assertRaises(DependencyViolationError):
            self.service.start_step(str(self.task_id), "P1-S2")
            
    def test_invalid_status_transition(self):
        # Completed -> In Progress should fail
        self.service.complete_step(str(self.task_id), "P1-S1")
        with self.assertRaises(InvalidStatusTransitionError):
            self.service.start_step(str(self.task_id), "P1-S1")
            
    def test_reopen_validation(self):
        # Complete P1-S1, then P1-S2
        self.service.complete_step(str(self.task_id), "P1-S1")
        self.service.complete_step(str(self.task_id), "P1-S2")
        
        # Trying to reopen P1-S1 while P1-S2 is completed should fail
        with self.assertRaises(DependencyViolationError) as context:
            self.service.reopen_step(str(self.task_id), "P1-S1")
        
        self.assertIn("downstream steps depend on it", str(context.exception))
        
    def test_database_persistence_and_recalculation(self):
        # Complete P1-S1
        task = self.service.complete_step(
        str(self.task_id),
        "P1-S1"
    )

        db_task = TaskRepository.get_task(
            self.task_id
        )

        step_status = (
            db_task["execution_plan"]["phases"][0]
            ["steps"][0]["status"]
        )

        self.assertEqual(
            step_status,
            "Completed"
        )
        self.assertEqual(db_task["status"], "in_progress")
        
        # Progress recalculation
        progress = task.get("progress", {})
        self.assertEqual(progress["completed_steps"], 1)
        self.assertEqual(progress["completed_hours"], 2)
        self.assertIn("P1-S2", progress["next_available_steps"])
        self.assertNotIn("P1-S1", progress["next_available_steps"])
        
        # Emergency mode recalculation
        em = task.get("emergency_mode", {})
        self.assertIn(
        "P1-S2",
        em["focus_steps"]
    )

        self.assertNotIn(
            "P1-S1",
            em["focus_steps"]
        )
        self.assertEqual(em["mandatory_steps_remaining"], 0)
        self.assertEqual(em["recommended_steps_remaining"], 1)
        self.assertEqual(em["remaining_estimated_hours"], 3)
        
    def test_task_completion(self):
        # Complete both steps
        self.service.complete_step(str(self.task_id), "P1-S1")
        task = self.service.complete_step(str(self.task_id), "P1-S2")
        
        self.assertEqual(task["status"], "completed")
        self.assertEqual(task["progress"]["overall_completion"], 100.0)
        self.assertIn("completed_at", task)
        self.assertTrue(task["completed_at"].endswith("Z") or "+00:00" in task["completed_at"])

    def test_dashboard_generation(self):
        dashboard = self.service.get_dashboard(
            str(self.task_id)
        )

        self.assertIn(
    dashboard["status"],
    [
        "planned",
        "in_progress",
        "completed"
    ]
)

        self.assertIn(
            "progress",
            dashboard
        )

        self.assertIn(
            "emergency_mode",
            dashboard
        )

        self.assertIn(
            "analysis",
            dashboard
        )

if __name__ == "__main__":
    unittest.main()
