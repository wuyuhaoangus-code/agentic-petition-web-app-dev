from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.features.documents.service import document_service
from app.db.session import get_db
from app.core.security import get_current_user
import logging
import json
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)


def _criteria_to_list(raw_criteria):
    """Normalize criteria from DB into a string array for frontend compatibility."""
    if raw_criteria is None:
        return []
    if isinstance(raw_criteria, list):
        return [str(c).strip() for c in raw_criteria if str(c).strip()]
    if isinstance(raw_criteria, str):
        value = raw_criteria.strip()
        if not value:
            return []
        # JSON array string support
        if value.startswith("["):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(c).strip() for c in parsed if str(c).strip()]
            except Exception:
                pass
        # Comma-separated fallback
        return [c.strip() for c in value.split(",") if c.strip()]
    return [str(raw_criteria).strip()]

@router.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    current_user: any = Depends(get_current_user)
):
    """Endpoint to extract text with a streaming response for progress updates."""
    try:
        from app.features.document_ai.vision import vision_service
    except Exception as exc:
        logger.error(f"Vision dependency unavailable: {exc}")
        raise HTTPException(status_code=503, detail="Vision service is not available")
    # Allow common document formats including legacy .doc
    allowed_extensions = ('.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg')
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    content = await file.read()
    
    # Wrapper generator to convert dicts to JSON strings for the NDJSON stream
    async def generate():
        async for page_data in vision_service.extract_text_stream(content):
            yield json.dumps(page_data) + "\n"

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson"
    )

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    application_id: str = Form(None),
    category: str = Form(None),
    is_sensitive: bool = Form(False),
    criteria: str = Form(None),
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Uploads a file to backend-managed storage and saves metadata.
    Returns the database record ID.
    Also triggers Vision OCR.
    """
    try:
        logger.info(f"Uploading file: {file.filename}, category: {category}, criteria: {criteria}")
        content = await file.read()
        user_id = uuid.UUID(current_user.id)
        app_uuid = uuid.UUID(application_id) if application_id else None
        
        # Clean criteria string
        clean_criteria = criteria if criteria and criteria.strip() != "" else None
        
        db_id = await document_service.handle_upload(
            db=db, 
            file_bytes=content, 
            filename=file.filename,
            user_id=user_id,
            application_id=app_uuid,
            category=category,
            criteria=clean_criteria,
            file_size=file.size,
            file_type=file.content_type,
            is_sensitive=is_sensitive
        )
        return {"id": db_id, "filename": file.filename, "status": "uploaded"}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual-evidence")
async def add_manual_evidence(
    title: str = Form(...),
    content: str = Form(...),
    application_id: str = Form(None),
    category: str = Form(None),
    criteria: str = Form(None),
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """Adds a manually entered evidence description."""
    try:
        user_id = uuid.UUID(current_user.id)
        app_uuid = uuid.UUID(application_id) if application_id else None
        evidence_id = await document_service.add_manual_evidence(
            db=db,
            user_id=user_id,
            title=title,
            content=content,
            application_id=app_uuid,
            category=category,
            criteria=criteria
        )
        return {"id": str(evidence_id), "status": "success"}
    except Exception as e:
        logger.error(f"Failed to add manual evidence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ocr-from-storage/{document_id}")
async def ocr_from_storage(
    document_id: uuid.UUID,
    application_id: str = Form(None),
    bucket_name: str = Form(None),
    force_reextract: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Runs Google Vision OCR for a document already stored in Supabase Storage
    and saves the extracted text into user_evidence_content.
    """
    try:
        user_id = uuid.UUID(current_user.id)
        app_uuid = uuid.UUID(application_id) if application_id else None
        evidence_id = await document_service.process_supabase_document_ocr(
            db=db,
            user_id=user_id,
            document_id=document_id,
            application_id=app_uuid,
            bucket_name=bucket_name,
            force_reextract=force_reextract,
        )
        if not evidence_id:
            raise HTTPException(status_code=404, detail="Document not found or OCR produced no text")
        return {"status": "success", "document_id": str(document_id), "evidence_id": str(evidence_id)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed OCR from Supabase Storage for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evidence-content")
async def get_evidence_content(
    application_id: str = None,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """Retrieves all evidence content for the current user."""
    try:
        user_id = uuid.UUID(current_user.id)
        app_uuid = uuid.UUID(application_id) if application_id else None
        content = document_service.get_user_evidence_content(db, user_id, app_uuid)
        return [
            {
                "id": str(c.id),
                "application_id": str(c.application_id) if c.application_id else None,
                "file_id": str(c.file_id) if c.file_id else None,
                "title": c.title,
                "content": c.content,
                "category": c.category,
                "criteria": c.criteria,
                "criteria_list": _criteria_to_list(c.criteria),
                "type": c.type,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in content
        ]
    except Exception as e:
        logger.error(f"Failed to list evidence content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/manual-evidence/{evidence_id}")
async def update_manual_evidence(
    evidence_id: uuid.UUID,
    title: str = Form(None),
    content: str = Form(None),
    category: str = Form(None),
    criteria: str = Form(None),
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """Updates a manual evidence entry."""
    try:
        user_id = uuid.UUID(current_user.id)
        updated = document_service.update_manual_evidence(
            db=db,
            user_id=user_id,
            evidence_id=evidence_id,
            title=title,
            content=content,
            category=category,
            criteria=criteria
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Manual evidence not found")
        return {"status": "success", "id": str(updated.id)}
    except Exception as e:
        logger.error(f"Failed to update manual evidence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/manual-evidence/{evidence_id}")
async def delete_manual_evidence(
    evidence_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """Deletes a manual evidence entry."""
    try:
        user_id = uuid.UUID(current_user.id)
        success = document_service.delete_manual_evidence(db, user_id, evidence_id)
        if not success:
            raise HTTPException(status_code=404, detail="Manual evidence not found")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Failed to delete manual evidence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_documents(
    application_id: str = None,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Lists all documents uploaded by the current user.
    """
    try:
        user_id = uuid.UUID(current_user.id)
        app_uuid = uuid.UUID(application_id) if application_id else None
        files = document_service.get_user_files(db, user_id, app_uuid)
        
        return [
            {
                "id": str(f.id),
                "application_id": str(f.application_id) if f.application_id else None,
                "filename": f.file_name,
                "size": f.file_size,
                "url": f.file_url,
                "file_type": f.file_type,
                "is_sensitive": f.is_sensitive,
                "category": f.category,
                "criteria": f.criteria,
                "criteria_list": _criteria_to_list(f.criteria),
                "created_at": f.created_at.isoformat() if f.created_at else None,
                "status": "uploaded"
            }
            for f in files
        ]
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{document_id}")
async def update_document(
    document_id: uuid.UUID,
    application_id: str = None,
    category: str = None,
    criteria: str = None,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Updates metadata for a specific document.
    """
    try:
        user_id = uuid.UUID(current_user.id)
        app_uuid = uuid.UUID(application_id) if application_id else None
        
        # Clean criteria string
        clean_criteria = criteria if criteria and criteria.strip() != "" else None
        
        updated_file = document_service.update_metadata(
            db=db,
            user_id=user_id,
            document_id=document_id,
            application_id=app_uuid,
            category=category,
            criteria=clean_criteria
        )
        
        if not updated_file:
            raise HTTPException(status_code=404, detail="Document not found")
            
        return {"status": "success", "id": str(updated_file.id)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    application_id: str = None,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Deletes a specific document.
    """
    try:
        user_id = uuid.UUID(current_user.id)
        app_uuid = uuid.UUID(application_id) if application_id else None
        success = document_service.delete_document(db, user_id, document_id, app_uuid)
        
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
            
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(status_code=500, detail=str(e))
