from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.features.users.models import Profile


class ProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> Optional[Profile]:
        return self.db.query(Profile).filter(Profile.id == user_id).first()

    def add(self, profile: Profile) -> None:
        self.db.add(profile)
