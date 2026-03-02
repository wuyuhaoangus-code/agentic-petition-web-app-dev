from app.core.storage import get_supabase_storage_gateway
from app.features.documents.models import UserFile
from sqlalchemy.orm import Session

class DocumentService:
    @staticmethod
    async def process_upload(db: Session, user_id: int, file_name: str, content: bytes):
        # 1. Upload the raw bytes to Supabase Storage
        storage_path = f"uploads/user_{user_id}/{file_name}"
        storage_gateway = get_supabase_storage_gateway()
        uploaded = False
        try:
            storage_gateway.upload(storage_path, content, "application/octet-stream")
            uploaded = True

            # 2. Save the storage path to Postgres
            new_file = UserFile(
                user_id=user_id,
                file_url=storage_path,
                file_name=file_name
            )
            db.add(new_file)
            db.commit()
            db.refresh(new_file)
        except Exception:
            db.rollback()
            if uploaded:
                try:
                    storage_gateway.delete(storage_path)
                except Exception:
                    pass
            raise
        
        return new_file
