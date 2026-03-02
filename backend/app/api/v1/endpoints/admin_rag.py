from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict
import os

from app.features.rag.services import AAOIngestionService
from app.core.config import settings

router = APIRouter()

# In a real production app, you'd want to protect this with admin-only permissions
@router.post("/sync", status_code=202)
async def sync_aao_decisions(
    background_tasks: BackgroundTasks,
    directory_path: str = "./aao_eb1a_decisions"
):
    """
    Triggers the RAG ingestion process for AAO EB-1A decisions.
    This runs as a background task to prevent request timeouts.
    """
    # Check if directory exists
    if not os.path.exists(directory_path):
        raise HTTPException(status_code=404, detail=f"Directory {directory_path} not found")

    service = AAOIngestionService()
    
    # Add to FastAPI background tasks
    # For higher scale, use Celery or RQ as requested
    background_tasks.add_task(service.ingest_directory, directory_path)
    
    return {
        "message": "Ingestion process started in the background",
        "directory": directory_path
    }
