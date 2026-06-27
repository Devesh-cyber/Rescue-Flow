import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from data_extraction import TaskExtractor
from database.task_repository import TaskRepository
from task_analysis import TaskAnalysisAgents
from execution_plan import ExecutionPlanAgent
from progress_tracker import ProgressTrackerAgent
from emergency_mode import EmergencyModeAgent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["Tasks"])

class TaskCreateRequest(BaseModel):
    source: str

@router.post("/create")
async def create_task(request: TaskCreateRequest):
    try:
        # 1. TaskExtractor.extract()
        extracted_data = TaskExtractor.extract(request.source)
        
        # 2. TaskRepository.create_task()
        task_id = TaskRepository.create_task(extracted_data)
        
        # 3. TaskAnalysisAgent.task_analysis()
        task_analysis_agent = TaskAnalysisAgents()
        analysis = task_analysis_agent.task_analysis(extracted_data)
        
        # 4. save analysis
        TaskRepository.update_analysis(task_id, analysis)
        
        # 5. ExecutionPlanAgent.create_plan()
        execution_plan_agent = ExecutionPlanAgent()
        plan = execution_plan_agent.create_plan(analysis, extracted_data)
        
        # 6. save execution plan
        plan_dict = plan.model_dump() if hasattr(plan, "model_dump") else (plan.dict() if hasattr(plan, "dict") else plan)
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
