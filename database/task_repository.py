import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from pymongo.results import DeleteResult, UpdateResult

from .database import tasks

logger = logging.getLogger(__name__)


class TaskRepository:

    @staticmethod
    def create_task(raw_task: Dict[str, Any]) -> ObjectId:

        task_document = {
        **raw_task,
        "analysis": raw_task.get("analysis"),
        "execution_plan": raw_task.get("execution_plan"),
        "progress": raw_task.get("progress"),
        "emergency_mode": raw_task.get("emergency_mode"),
        "status": raw_task.get("status", "created")
    }

        result = tasks.insert_one(task_document)

        logger.info(
            f"Database update success: Task created with ID {result.inserted_id}"
        )

        return result.inserted_id

    @staticmethod
    def get_task(task_id: ObjectId) -> Optional[Dict[str, Any]]:

        task = tasks.find_one({"_id": task_id})

        if task:
            logger.info(
                f"Database read success: Retrieved task {task_id}"
            )
        else:
            logger.warning(
                f"Database read failure: Task {task_id} not found"
            )

        return task

    @staticmethod
    def task_exists(task_id: ObjectId) -> bool:

        return (
            tasks.count_documents(
                {"_id": task_id},
                limit=1
            )
            > 0
        )

    @staticmethod
    def update_status(
        task_id: ObjectId,
        status: str
    ) -> UpdateResult:

        try:

            result = tasks.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "status": status
                    }
                }
            )

            logger.info(
                f"Database update success: Status updated to '{status}' for task {task_id}"
            )

            return result

        except Exception:
            logger.exception(
                f"Database update failure: Status update for task {task_id}"
            )
            raise

    @staticmethod
    def update_completed_at(
        task_id: ObjectId
    ) -> UpdateResult:

        try:

            result = tasks.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "completed_at":
                        datetime.now(
                            timezone.utc
                        ).isoformat()
                    }
                }
            )

            logger.info(
                f"Database update success: completed_at updated for task {task_id}"
            )

            return result

        except Exception:
            logger.exception(
                f"Database update failure: completed_at update for task {task_id}"
            )
            raise

    @staticmethod
    def update_analysis(
        task_id: ObjectId,
        analysis: Dict[str, Any]
    ) -> UpdateResult:

        try:

            result = tasks.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "analysis": analysis,
                        "status": "analyzed"
                    }
                }
            )

            logger.info(
                f"Database update success: Analysis updated for task {task_id}"
            )

            return result

        except Exception:
            logger.exception(
                f"Database update failure: Analysis update for task {task_id}"
            )
            raise

    @staticmethod
    def update_execution(
        task_id: ObjectId,
        execution: Dict[str, Any]
    ) -> UpdateResult:

        try:

            result = tasks.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "execution_plan": execution,
                        "status": "planned"
                    }
                }
            )

            logger.info(
                f"Database update success: Execution plan updated for task {task_id}"
            )

            return result

        except Exception:
            logger.exception(
                f"Database update failure: Execution plan update for task {task_id}"
            )
            raise

    @staticmethod
    def update_execution_plan(
        task_id: ObjectId,
        execution_plan: Dict[str, Any]
    ) -> UpdateResult:

        try:

            result = tasks.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "execution_plan": execution_plan
                    }
                }
            )

            logger.info(
                f"Database update success: Execution plan updated for task {task_id}"
            )

            return result

        except Exception:
            logger.exception(
                f"Database update failure: Execution plan update for task {task_id}"
            )
            raise

    @staticmethod
    def update_progress(
        task_id: ObjectId,
        execution_plan: Dict[str, Any],
        progress: Dict[str, Any]
    ) -> UpdateResult:

        try:

            completion = progress.get(
                "overall_completion",
                0
            )

            if completion == 0:
                status = "planned"
            elif completion == 100:
                status = "completed"
            else:
                status = "in_progress"

            result = tasks.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "execution_plan": execution_plan,
                        "progress": progress,
                        "status": status
                    }
                }
            )

            logger.info(
                f"Database update success: Progress updated for task {task_id}"
            )

            return result

        except Exception:
            logger.exception(
                f"Database update failure: Progress update for task {task_id}"
            )
            raise

    @staticmethod
    @staticmethod
    def update_emergency_mode(
        task_id: ObjectId,
        emergency_mode: Dict[str, Any]
    ) -> UpdateResult:

        try:

            result = tasks.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "emergency_mode": emergency_mode
                    }
                }
            )

            logger.info(
                f"Database update success: Emergency mode updated for task {task_id}"
            )

            return result

        except Exception:
            logger.exception(
                f"Database update failure: Emergency mode update for task {task_id}"
            )
            raise

    @staticmethod
    def update_fields(
        task_id: ObjectId,
        fields: Dict[str, Any]
    ) -> UpdateResult:

        try:

            result = tasks.update_one(
                {"_id": task_id},
                {
                    "$set": fields
                }
            )

            logger.info(
                f"Database update success: Generic update for task {task_id}"
            )

            return result

        except Exception:
            logger.exception(
                f"Database update failure: Generic update for task {task_id}"
            )
            raise

    @staticmethod
    def delete_task(
        task_id: ObjectId
    ) -> DeleteResult:

        return tasks.delete_one(
            {"_id": task_id}
        )