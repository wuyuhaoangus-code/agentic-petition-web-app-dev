from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import logging

from app.db.session import get_db
from app.core.security import get_current_user
from app.features.users.service import profile_service
from app.features.documents.bouncer import bouncer_agent
from app.features.drafter.eb1a.langchain_drafter import langchain_drafter

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/profile")
async def get_profile(
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    user_id = uuid.UUID(current_user.id)
    profile = profile_service.get_profile(db, user_id)
    if not profile:
        return {"id": str(user_id), "full_name": None, "field": None, "occupation": None}
    
    return {
        "id": str(profile.id),
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "full_name": profile.full_name,
        "field": profile.field,
        "occupation": profile.occupation
    }

@router.post("/profile/analyze")
async def analyze_user_profile(
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Analyzes the user's basicInfo (CV/Resume) and populates the profile table.
    """
    try:
        user_id = uuid.UUID(current_user.id)
        
        # 1. Get the basic info context
        context = await langchain_drafter._get_user_context(db, user_id)
        if "EB-1A Petitioner" in context and len(context) < 50:
             raise HTTPException(status_code=404, detail="No background information (CV/Resume) found. Please upload one first.")

        # 2. Run LLM analysis
        analysis = await bouncer_agent.analyze_profile(context)
        
        if not analysis:
            raise HTTPException(status_code=500, detail="Failed to analyze profile information.")
            
        # 3. Update profile
        profile = profile_service.update_profile(db, user_id, analysis)
        
        return {
            "status": "success",
            "profile": {
                "first_name": profile.first_name,
                "last_name": profile.last_name,
                "field": profile.field,
                "occupation": profile.occupation
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile analysis endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/profile")
async def update_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Manually updates the user profile.
    """
    try:
        user_id = uuid.UUID(current_user.id)
        profile = profile_service.update_profile(db, user_id, data)
        return {
            "status": "success",
            "profile": {
                "first_name": profile.first_name,
                "last_name": profile.last_name,
                "field": profile.field,
                "occupation": profile.occupation
            }
        }
    except Exception as e:
        logger.error(f"Failed to update profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))
