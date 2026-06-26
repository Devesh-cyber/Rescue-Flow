from typing import Any, Dict, Optional
from bson import ObjectId
from database.database import tasks

class TaskRepository:

    @staticmethod
    def create_task(raw_task: Dict[str, Any]) -> ObjectId:
        task_document = {
            **raw_task,
            "analysis": None,
            "execution_plan": None,
            "progress": None,
            "emergency_mode": None
        }

        result = tasks.insert_one(task_document)
        return result.inserted_id

    @staticmethod
    def update_analysis(task_id: ObjectId, analysis: Dict[str, Any]) -> None:
        tasks.update_one(
            {"_id": task_id},
            {
                "$set": {
                    "analysis": analysis,
                    "status": "analyzed"
                }
            }
        )

    @staticmethod
    def update_execution(task_id: ObjectId, execution: Dict[str, Any]) -> None:
        tasks.update_one(
            {"_id": task_id},
            {
                "$set": {
                    "execution_plan": execution,
                    "status": "planned"
                }
            }
        )

    @staticmethod
    def update_task_progress(task_id: ObjectId, execution_plan: Dict[str, Any], progress: Dict[str, Any]) -> None:
        status = "completed" if progress.get("overall_completion") == 100 else "in_progress"

        tasks.update_one(
            {"_id": task_id},
            {
                "$set": {
                    "execution_plan": execution_plan,
                    "progress": progress,
                    "status": status
                }
            }
        )

    @staticmethod
    def update_emergency_mode(task_id: ObjectId, emergency_mode: Dict[str, Any]) -> None:
        tasks.update_one(
            {"_id": task_id},
            {
                "$set": {
                    "emergency_mode": emergency_mode,
                    "status": "emergency_mode_ready"
                }
            }
        )

    @staticmethod
    def get_task(task_id: ObjectId) -> Optional[Dict[str, Any]]:
        return tasks.find_one({"_id": task_id})