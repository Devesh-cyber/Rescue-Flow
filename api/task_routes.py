import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from services.task_list_service import TaskListService

from data_extraction import TaskExtractor
from database.task_repository import TaskRepository
from task_analysis import TaskAnalysisAgents
from execution_plan import ExecutionPlanAgent
from progress_tracker import ProgressTrackerAgent
from emergency_mode import EmergencyModeAgent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["Tasks"])
task_list_service = TaskListService()

class TaskCreateRequest(BaseModel):
    source: str

@router.post("/create")
async def create_task(request: TaskCreateRequest):
    try:
        if not request.source or len(request.source.strip()) < 10:
            raise HTTPException(status_code=400, detail="Source text is too short or empty.")
            
        if len(request.source) > 100000:
            raise HTTPException(status_code=400, detail="Source text is too large. Maximum length is 100,000 characters.")

        # 1. TaskExtractor.extract()
        extracted_data = TaskExtractor.extract(request.source)
        
        # 2. TaskRepository.create_task()
        task_id = TaskRepository.create_task(extracted_data)
        
        # 3. TaskAnalysisAgent.task_analysis()
        try:
            task_analysis_agent = TaskAnalysisAgents()
            analysis = task_analysis_agent.task_analysis(extracted_data)
        except Exception as e:
            logger.warning(f"AI Analysis failed: {e}. Using fallback.")
            analysis = {
                "title": extracted_data.get("title", "Untitled Task"),
                "summary": extracted_data.get("content", "")[:150] + "...",
                "task_type": "Project",
                "deadline": "2026-12-31T23:59:59Z",
                "priority": "High",
                "difficulty": "Medium",
                "estimated_hours": 10.0,
                "confidence": 0.5
            }
        
        # 4. save analysis
        TaskRepository.update_analysis(task_id, analysis)
        
        # 5. ExecutionPlanAgent.create_plan()
        try:
            execution_plan_agent = ExecutionPlanAgent()
            plan = execution_plan_agent.create_plan(analysis, extracted_data)
            plan_dict = plan.model_dump() if hasattr(plan, "model_dump") else (plan.dict() if hasattr(plan, "dict") else plan)
        except Exception as e:
            logger.warning(f"AI Execution Plan failed: {e}. Using fallback.")
            plan_dict = {
                "total_estimated_hours": 10.0,
                "critical_path": ["step_1", "step_2", "step_3"],
                "phases": [
                    {
                        "phase_id": "phase_1",
                        "title": "Understand Requirements",
                        "description": "Analyze and plan the work.",
                        "steps": [
                            {
                                "step_id": "step_1",
                                "title": "Read assignment",
                                "description": "Review requirements.",
                                "estimated_hours": 2.0,
                                "status": "Pending",
                                "emergency_priority": "High"
                            },
                            {
                                "step_id": "step_2",
                                "title": "Identify deliverables",
                                "description": "List all outputs.",
                                "estimated_hours": 1.0,
                                "status": "Pending",
                                "emergency_priority": "High"
                            }
                        ]
                    },
                    {
                        "phase_id": "phase_2",
                        "title": "Implementation",
                        "description": "Execute the task.",
                        "steps": [
                            {
                                "step_id": "step_3",
                                "title": "Complete core work",
                                "description": "Do the main tasks.",
                                "estimated_hours": 5.0,
                                "status": "Pending",
                                "emergency_priority": "High"
                            }
                        ]
                    },
                    {
                        "phase_id": "phase_3",
                        "title": "Final Review",
                        "description": "Verify before submission.",
                        "steps": [
                            {
                                "step_id": "step_4",
                                "title": "Verify submission",
                                "description": "Check against rubric.",
                                "estimated_hours": 2.0,
                                "status": "Pending",
                                "emergency_priority": "Medium"
                            }
                        ]
                    }
                ]
            }
        
        # 6. save execution plan
        TaskRepository.update_execution_plan(task_id, plan_dict)
        
        # 7. ProgressTracker.initialize_progress()
        progress_tracker = ProgressTrackerAgent()
        progress_tracker.initialize_progress(str(task_id))
        
        # 8. EmergencyMode.update_emergency_mode()
        emergency_mode_agent = EmergencyModeAgent()
        emergency_mode_agent.update_emergency_mode(str(task_id))
        
        logger.info(f"Task created: {task_id}")
        
        return {
            "task_id": str(task_id),
            "status": "created"
        }
    except Exception as e:
        logger.error(f"API error creating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_all_tasks():
    try:
        return task_list_service.get_tasks()

    except Exception as e:
        logger.error(f"API error getting task list: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
@router.get("/{task_id}")
async def get_task(task_id: str):
    try:
        if not ObjectId.is_valid(task_id):
            raise HTTPException(status_code=400, detail="Invalid ObjectId")
            
        task = TaskRepository.get_task(ObjectId(task_id))
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        logger.info(f"Task loaded: {task_id}")
        
        # Convert ObjectId to string for JSON serialization
        if "_id" in task:
            task["_id"] = str(task["_id"])
            
        return task
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API error getting task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{task_id}")
async def delete_task(task_id: str):
    try:

        if not ObjectId.is_valid(task_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid ObjectId"
            )

        result = TaskRepository.delete_task(
            ObjectId(task_id)
        )

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        logger.info(
            f"Task deleted: {task_id}"
        )

        return {
            "success": True,
            "task_id": task_id
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(
            f"API error deleting task {task_id}: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )