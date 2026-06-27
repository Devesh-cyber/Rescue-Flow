import logging
from fastapi import APIRouter, HTTPException
from services.dashboard_service import DashboardService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
dashboard_service = DashboardService()

@router.get("/{task_id}")
async def get_dashboard(task_id: str):
    try:
        logger.info(f"Dashboard requested for task: {task_id}")
        return dashboard_service.get_dashboard(task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail="Task not found")
    except Exception as e:
        logger.error(f"API error getting dashboard for task {task_id}: {e}")
        if "not found" in str(e).lower() or "invalid task id" in str(e).lower():
            raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{task_id}/summary")
async def get_task_summary(task_id: str):
    try:
        return dashboard_service.get_task_summary(task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail="Task not found")
    except Exception as e:
        logger.error(f"API error getting summary for task {task_id}: {e}")
        if "not found" in str(e).lower() or "invalid task id" in str(e).lower():
             raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{task_id}/progress")
async def get_progress_view(task_id: str):
    try:
        return dashboard_service.get_progress_view(task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail="Task not found")
    except Exception as e:
        logger.error(f"API error getting progress for task {task_id}: {e}")
        if "not found" in str(e).lower() or "invalid task id" in str(e).lower():
             raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{task_id}/execution")
async def get_execution_view(task_id: str):
    try:
        return dashboard_service.get_execution_view(task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail="Task not found")
    except Exception as e:
        logger.error(f"API error getting execution view for task {task_id}: {e}")
        if "not found" in str(e).lower() or "invalid task id" in str(e).lower():
             raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{task_id}/emergency")
async def get_emergency_view(task_id: str):
    try:
        return dashboard_service.get_emergency_view(task_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail="Task not found")
    except Exception as e:
        logger.error(f"API error getting emergency view for task {task_id}: {e}")
        if "not found" in str(e).lower() or "invalid task id" in str(e).lower():
             raise HTTPException(status_code=404, detail="Task not found")
        raise HTTPException(status_code=500, detail=str(e))
