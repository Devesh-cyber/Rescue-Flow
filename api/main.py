import logging
from fastapi import FastAPI
from api.task_routes import router as task_router
from api.execution_routes import router as execution_router
from api.dashboard_routes import router as dashboard_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Deadline Rescue API",
    version="1.0.0"
)

app.include_router(task_router)
app.include_router(execution_router)
app.include_router(dashboard_router)

@app.get("/")
async def health_check():
    return {
        "service": "Deadline Rescue API",
        "status": "running"
    }
