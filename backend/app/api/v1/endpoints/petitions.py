import logging
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.features.petitions import use_cases

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/user-exhibits")
async def get_user_exhibits(
    application_id: uuid.UUID = None,
    latest_only: bool = False,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Retrieves all confirmed exhibits and their items for the current user.
    """
    return use_cases.get_user_exhibits(
        db=db,
        current_user=current_user,
        application_id=application_id,
        latest_only=latest_only,
    )

@router.post("/generate-exhibits")
async def generate_exhibits(
    criteria_id: str,
    application_id: uuid.UUID = None,
    run_id: uuid.UUID = None, # Allow passing an existing run_id to continue a session
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Runs the Bouncer Agent to group documents into exhibits for a specific criteria.
    """
    return await use_cases.generate_exhibits(
        db=db,
        current_user=current_user,
        criteria_id=criteria_id,
        application_id=application_id,
        run_id=run_id,
    )

@router.post("/propose-exhibits")
async def propose_exhibits(
    criteria_id: str,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Returns proposed groupings for documents under a criteria without saving to DB.
    """
    return await use_cases.propose_exhibits(
        db=db,
        current_user=current_user,
        criteria_id=criteria_id,
    )

from pydantic import BaseModel

class ExhibitConfirmation(BaseModel):
    title: str
    summary: str = None
    doc_ids: List[str]

class ConfirmationRequest(BaseModel):
    criteria_id: str
    application_id: uuid.UUID = None
    exhibits: List[ExhibitConfirmation]
    run_id: uuid.UUID = None

@router.post("/confirm-exhibits")
async def confirm_exhibits(
    request: ConfirmationRequest,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Saves user-confirmed exhibit groupings to the database.
    """
    return await use_cases.confirm_exhibits(
        db=db,
        current_user=current_user,
        criteria_id=request.criteria_id,
        application_id=request.application_id,
        exhibits=[e.dict() for e in request.exhibits],
        run_id=request.run_id,
    )

@router.post("/draft-petition-section")
async def draft_petition_section(
    exhibit_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Runs the Drafter Agent for a specific exhibit group.
    """
    return await use_cases.draft_petition_section(
        db=db,
        current_user=current_user,
        exhibit_id=exhibit_id,
    )

@router.post("/synthesize-section-conclusion")
async def synthesize_section_conclusion(
    run_id: uuid.UUID,
    criteria_id: str = None,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Synthesizes and caches the final conclusion and intro for a specific generation run.
    """
    return await use_cases.synthesize_section_conclusion(
        db=db,
        current_user=current_user,
        run_id=run_id,
        criteria_id=criteria_id,
    )

@router.get("/download-petition-section")
async def download_petition_section(
    run_ids: str,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Assembles one or more generation runs into a single .docx file for download.
    run_ids: comma-separated list of UUIDs
    """
    return await use_cases.download_petition_section(
        db=db,
        current_user=current_user,
        run_ids=run_ids,
    )

class GenerateFinalDocumentRequest(BaseModel):
    run_ids: List[uuid.UUID]
    application_id: uuid.UUID = None
    version_label: str = None
    title: str = None

@router.post("/generate-final-document")
async def generate_final_document(
    request: GenerateFinalDocumentRequest,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Builds the final petition .docx and persists it to Supabase Storage + metadata table.
    Returns a document_id that can be downloaded separately.
    """
    return await use_cases.generate_final_document(
        db=db,
        current_user=current_user,
        run_ids=request.run_ids,
        application_id=request.application_id,
        version_label=request.version_label,
        title=request.title,
    )


@router.get("/user-petition-documents")
async def list_user_petition_documents(
    application_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    List generated petition documents for the current user, optionally filtered by application_id.
    Ordered by created_at ascending so v1 = earliest.
    """
    return use_cases.list_user_petition_documents(
        db=db,
        current_user=current_user,
        application_id=application_id,
    )


@router.get("/in-progress-runs")
async def list_in_progress_runs(
    application_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    List petition runs that are still 'generating' and have no saved document (stuck runs).
    Used by the frontend to show "Generation didn't complete" and offer retry.
    """
    return use_cases.list_in_progress_runs(
        db=db,
        current_user=current_user,
        application_id=application_id,
    )


@router.get("/export-package")
async def export_package(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Builds a petition package ZIP: 01 Cover Letter, 02-04 form placeholders, 05 Petition Letter,
    then exhibit files (06 - Exhibit 1 - [Title] - [name].ext, etc.). Option A flat naming.
    """
    return use_cases.export_package(
        db=db,
        current_user=current_user,
        document_id=document_id,
    )


@router.get("/export-package-manifest")
async def export_package_manifest(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Returns immutable package entry list for a generated petition document.
    """
    return use_cases.get_export_package_manifest(
        db=db,
        current_user=current_user,
        document_id=document_id,
    )


@router.get("/download-final-document")
async def download_final_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Downloads a previously generated final petition document by document_id.
    """
    return use_cases.download_final_document(
        db=db,
        current_user=current_user,
        document_id=document_id,
    )

@router.get("/download-petition-intro")
async def download_petition_intro(
    db: Session = Depends(get_db),
    current_user: any = Depends(get_current_user)
):
    """
    Generates the pre-exhibits petition intro section as a .docx file.
    """
    return await use_cases.download_petition_intro(
        db=db,
        current_user=current_user,
    )
