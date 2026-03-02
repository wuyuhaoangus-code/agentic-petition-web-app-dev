import uuid
import logging
from typing import Optional, Dict
from sqlalchemy.orm import Session
from app.features.users.models import Profile
from app.features.users.repositories import ProfileRepository

logger = logging.getLogger(__name__)

class ProfileService:
    def get_profile(self, db: Session, user_id: uuid.UUID) -> Optional[Profile]:
        repo = ProfileRepository(db)
        return repo.get_by_id(user_id)

    def update_profile(self, db: Session, user_id: uuid.UUID, data: Dict) -> Profile:
        repo = ProfileRepository(db)
        profile = repo.get_by_id(user_id)
        if not profile:
            profile = Profile(id=user_id)
            repo.add(profile)
        
        for key, value in data.items():
            if hasattr(profile, key) and value is not None:
                setattr(profile, key, value)
        
        # Sync full_name if first/last name changed
        if 'first_name' in data or 'last_name' in data:
            fname = data.get('first_name') or profile.first_name or ""
            lname = data.get('last_name') or profile.last_name or ""
            profile.full_name = f"{fname} {lname}".strip()
            
        try:
            db.commit()
        except Exception as commit_err:
            db.rollback()
            logger.error(f"Failed to update profile: {commit_err}")
            raise
        db.refresh(profile)
        return profile

profile_service = ProfileService()
