import io
import logging
import re
import uuid
import zipfile
from datetime import datetime
from typing import Any, Dict, List, Optional
from types import SimpleNamespace

from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import text, func, desc, cast, String, or_, and_
from sqlalchemy.orm import Session
from app.core.storage import get_supabase_storage_gateway
from app.core.observability import log_event

from app.features.documents.bouncer import bouncer_agent
from app.features.drafter.eb1a.langchain_drafter import langchain_drafter as drafter
from app.features.documents.document_builder import document_builder
from app.features.documents.cover_letter_document_builder import build_cover_letter_bytes
from app.features.documents.models import (
    UserCriteriaDraft,
    UserFile,
    UserExhibit,
    UserExhibitItem,
    UserPetitionDraft,
    UserPetitionDocument,
    PetitionRun,
)
from app.features.documents.service import document_service
from app.features.users.service import profile_service
from app.features.documents.repositories import DocumentRepository
from app.features.petitions.repositories import (
    CriteriaDraftRepository,
    ExhibitRepository,
    PetitionDocumentRepository,
    PetitionDraftRepository,
    PetitionRunRepository,
)

logger = logging.getLogger(__name__)


def get_user_exhibits(
    db: Session,
    current_user: Any,
    application_id: uuid.UUID = None,
    latest_only: bool = False,
):
    try:
        exhibit_repo = ExhibitRepository(db)
        user_id = uuid.UUID(current_user.id)
        if latest_only:
            latest_exhibit = exhibit_repo.get_latest_for_user(user_id, application_id=application_id)
            if not latest_exhibit:
                return []
            if latest_exhibit.run_id:
                exhibits = exhibit_repo.get_by_run(user_id, latest_exhibit.run_id)
            else:
                exhibits = exhibit_repo.get_by_user(user_id, application_id=application_id)
        else:
            exhibits = exhibit_repo.get_by_user(user_id, application_id=application_id)

        result = []
        for e in exhibits:
            items = exhibit_repo.get_items_for_exhibit(e.id)
            result.append({
                "id": str(e.id),
                "user_id": str(e.user_id),
                "application_id": str(e.application_id) if e.application_id else None,
                "run_id": str(e.run_id) if e.run_id else None,
                "criteria_id": e.criteria_id,
                "section_letter": e.section_letter,
                "title": e.title,
                "exhibit_number": e.exhibit_number,
                "summary": e.summary,
                "draft_content": e.draft_content,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "items": [
                    {
                        "file_id": str(i.file_id) if i.file_id else None,
                        "content_id": str(i.content_id) if i.content_id else None,
                        "item_suffix": i.item_suffix,
                    }
                    for i in items
                ],
            })
        return result
    except Exception as e:
        logger.error(f"Failed to fetch user exhibits: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_exhibits(
    db: Session,
    current_user: Any,
    criteria_id: str,
    application_id: uuid.UUID = None,
    run_id: uuid.UUID = None,
):
    try:
        user_id = uuid.UUID(current_user.id)
        user_name = current_user.user_metadata.get("name", "The Petitioner")

        exhibits = await bouncer_agent.group_into_exhibits(
            db,
            user_id,
            criteria_id,
            user_name,
            run_id=run_id,
            application_id=application_id,
        )

        effective_run_id = str(exhibits[0].run_id) if exhibits else str(run_id) if run_id else None

        return {
            "status": "success",
            "run_id": effective_run_id,
            "exhibits": [
                {
                    "id": str(e.id),
                    "user_id": str(e.user_id),
                    "application_id": str(e.application_id) if e.application_id else None,
                    "run_id": str(e.run_id) if e.run_id else None,
                    "criteria_id": e.criteria_id,
                    "section_letter": e.section_letter,
                    "number": e.exhibit_number,
                    "title": e.title,
                    "summary": e.summary,
                    "draft_content": e.draft_content,
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                }
                for e in exhibits
            ],
        }
    except Exception as e:
        logger.error(f"Failed to generate exhibits: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def propose_exhibits(
    db: Session,
    current_user: Any,
    criteria_id: str,
):
    try:
        user_id = uuid.UUID(current_user.id)
        groupings = await bouncer_agent.propose_exhibit_groupings(db, user_id, criteria_id)
        return groupings
    except Exception as e:
        logger.error(f"Failed to propose exhibits: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def confirm_exhibits(
    db: Session,
    current_user: Any,
    criteria_id: str,
    application_id: uuid.UUID,
    exhibits: List[Dict[str, Any]],
    run_id: uuid.UUID = None,
):
    try:
        user_id = uuid.UUID(current_user.id)
        user_name = current_user.user_metadata.get("name", "The Petitioner")

        try:
            exhibit_counts = [
                {"title": e.get("title"), "doc_ids": len(e.get("doc_ids") or [])}
                for e in (exhibits or [])
            ]
            logger.info(
                "confirm_exhibits payload run_id=%s application_id=%s criteria_id=%s exhibits=%s",
                str(run_id) if run_id else None,
                str(application_id) if application_id else None,
                criteria_id,
                exhibit_counts,
            )
            print(
                f"CONFIRM_EXHIBITS payload run_id={run_id} application_id={application_id} "
                f"criteria_id={criteria_id} exhibits={exhibit_counts}"
            )
            if exhibits:
                sample = []
                for e in exhibits[:3]:
                    doc_ids = e.get("doc_ids") or []
                    sample.append({"title": e.get("title"), "doc_ids_sample": doc_ids[:5]})
                print(f"CONFIRM_EXHIBITS doc_id_samples={sample}")
        except Exception:
            logger.info("confirm_exhibits payload logging failed")

        verified_data = [
            {
                "achievement_name": e["title"],
                "doc_ids": e["doc_ids"],
                "search_query": e.get("summary") or e["title"],
            }
            for e in exhibits
        ]

        result_exhibits = await bouncer_agent.group_into_exhibits(
            db,
            user_id,
            criteria_id,
            user_name,
            run_id=run_id,
            verified_data=verified_data,
            application_id=application_id,
        )

        effective_run_id = str(result_exhibits[0].run_id) if result_exhibits else str(run_id) if run_id else None

        return {
            "status": "success",
            "run_id": effective_run_id,
            "exhibits": [
                {
                    "id": str(e.id),
                    "user_id": str(e.user_id),
                    "application_id": str(e.application_id) if e.application_id else None,
                    "run_id": str(e.run_id) if e.run_id else None,
                    "criteria_id": e.criteria_id,
                    "section_letter": e.section_letter,
                    "number": e.exhibit_number,
                    "title": e.title,
                    "summary": e.summary,
                    "draft_content": e.draft_content,
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                }
                for e in result_exhibits
            ],
        }
    except Exception as e:
        logger.error(f"Failed to confirm exhibits: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


async def draft_petition_section(
    db: Session,
    current_user: Any,
    exhibit_id: uuid.UUID,
):
    try:
        exhibit_repo = ExhibitRepository(db)
        draft_repo = PetitionDraftRepository(db)
        user_id = uuid.UUID(current_user.id)

        exhibit = exhibit_repo.get_by_id(exhibit_id, user_id)

        if not exhibit:
            raise HTTPException(status_code=404, detail="Exhibit not found")

        user_name = current_user.user_metadata.get("name", "The Petitioner")

        if exhibit.criteria_id == "personal_info":
            logger.info(f"Drafting overall Petition Intro (triggered by personal_info exhibit {exhibit_id})")
            petition_intro = await drafter.draft_petition_intro(db, user_id, user_name)

            existing_draft = draft_repo.get_intro(exhibit.run_id)

            if existing_draft:
                existing_draft.section_content = petition_intro
                if not existing_draft.application_id:
                    existing_draft.application_id = exhibit.application_id
                logger.info("Updated existing petition intro draft")
            else:
                profile = profile_service.get_profile(db, user_id)
                new_draft = UserPetitionDraft(
                    run_id=exhibit.run_id,
                    user_id=user_id,
                    application_id=exhibit.application_id,
                    section="intro",
                    section_content=petition_intro,
                    rag_field=profile.field if profile else None,
                    rag_occupation=profile.occupation if profile else None,
                )
                draft_repo.upsert_intro(new_draft)
                logger.info("Created new petition intro draft")

            try:
                db.commit()
            except Exception as commit_err:
                db.rollback()
                logger.error(f"Failed to persist petition intro draft: {commit_err}")
                raise HTTPException(status_code=500, detail="Failed to persist petition intro draft")
            return {"status": "success", "draft": petition_intro}

        profile = profile_service.get_profile(db, user_id)
        user_field = profile.field if profile and profile.field else "Extraordinary Ability"
        user_occupation = profile.occupation if profile and profile.occupation else "Petitioner"

        precedent_context = await drafter.rag_fetcher.get(
            criteria_id=exhibit.criteria_id or "awards",
            field=user_field,
            occupation=user_occupation,
            query_text=exhibit.title,
            user_id=user_id,
            db=db,
            force_refresh=False,
            run_id=exhibit.run_id,
        )

        draft = await drafter.draft_section(db, user_id, exhibit_id, user_name, precedent_context)

        return {"status": "success", "draft": draft}
    except Exception as e:
        logger.error(f"Failed to draft section: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def synthesize_section_conclusion(
    db: Session,
    current_user: Any,
    run_id: uuid.UUID,
    criteria_id: str = None,
):
    try:
        exhibit_repo = ExhibitRepository(db)
        criteria_repo = CriteriaDraftRepository(db)
        user_id = uuid.UUID(current_user.id)
        user_name = current_user.user_metadata.get("name", "The Petitioner")
        logger.info(f"Synthesizing conclusion for run {run_id}, criteria: {criteria_id}")

        try:
            db.execute(text("ALTER TABLE user_criteria_drafts ADD COLUMN IF NOT EXISTS section_intro TEXT"))
            db.execute(text("ALTER TABLE user_criteria_drafts ADD COLUMN IF NOT EXISTS criteria_id TEXT"))
            db.commit()
        except Exception as e:
            logger.warning(f"DB schema update ignored: {e}")
            db.rollback()

        normalized_criteria_id = (criteria_id or "").lower() if criteria_id else None

        if normalized_criteria_id:
            exhibits = exhibit_repo.get_by_run_and_criteria(user_id, run_id, normalized_criteria_id)
        else:
            exhibits = exhibit_repo.get_by_run(user_id, run_id)
            if petition_doc.application_id:
                current_item_count = (
                    db.query(func.count(UserExhibitItem.id))
                    .join(UserExhibit, UserExhibitItem.exhibit_id == UserExhibit.id)
                    .filter(
                        UserExhibit.user_id == user_id,
                        UserExhibit.run_id == run_id,
                    )
                    .scalar()
                    or 0
                )
                alt_run = (
                    db.query(
                        UserExhibit.run_id,
                        func.count(UserExhibitItem.id).label("item_cnt"),
                        func.max(UserExhibit.created_at).label("latest"),
                    )
                    .join(UserExhibitItem, UserExhibitItem.exhibit_id == UserExhibit.id)
                    .filter(
                        UserExhibit.user_id == user_id,
                        UserExhibit.application_id == petition_doc.application_id,
                    )
                    .group_by(UserExhibit.run_id)
                    .order_by(desc("item_cnt"), desc("latest"))
                    .first()
                )
                if alt_run and alt_run.run_id and alt_run.run_id != run_id:
                    if len(exhibits) == 0 or alt_run.item_cnt > current_item_count:
                        logger.info(
                            "Export package using alternate run_id with more exhibit items",
                            extra={
                                "document_run_id": str(run_id),
                                "alternate_run_id": str(alt_run.run_id),
                                "document_exhibit_count": len(exhibits),
                                "document_item_count": int(current_item_count),
                                "alternate_item_count": int(alt_run.item_cnt),
                            },
                        )
                        exhibits = exhibit_repo.get_by_run(user_id, alt_run.run_id)

        if not exhibits:
            logger.warning(f"No exhibits found for run {run_id} and criteria {criteria_id}")
            raise HTTPException(status_code=404, detail=f"No exhibits found for run {run_id} (criteria: {criteria_id})")

        effective_criteria_id = normalized_criteria_id or (exhibits[0].criteria_id or "").lower()
        application_id = exhibits[0].application_id
        logger.info(f"Found {len(exhibits)} exhibits for criteria {effective_criteria_id}")

        conclusion = await drafter.draft_exhibit_conclusion(db, user_id, exhibits, user_name)
        exhibit_intro = await drafter.draft_exhibit_intro(db, user_id, exhibits, user_name)

        logger.info(f"Generated exhibit intro (len: {len(exhibit_intro)}) and conclusion (len: {len(conclusion)})")

        criteria_draft = criteria_repo.get_by_run_and_criteria(run_id, effective_criteria_id)

        if not criteria_draft:
            logger.info(f"Creating new UserCriteriaDraft for {effective_criteria_id}")
            criteria_draft = UserCriteriaDraft(
                run_id=run_id,
                user_id=user_id,
                application_id=application_id,
                criteria_id=effective_criteria_id,
                section_intro=exhibit_intro,
                section_conclusion=conclusion,
            )
            criteria_repo.add(criteria_draft)
        else:
            logger.info(f"Updating existing UserCriteriaDraft for {effective_criteria_id}")
            criteria_draft.section_intro = exhibit_intro
            criteria_draft.section_conclusion = conclusion

        try:
            db.commit()
        except Exception as commit_err:
            db.rollback()
            logger.error(f"Failed to persist criteria draft: {commit_err}")
            raise HTTPException(status_code=500, detail="Failed to persist criteria draft")
        logger.info(f"Successfully saved criteria draft for {effective_criteria_id}")

        return {
            "status": "success",
            "criteria_id": effective_criteria_id,
            "section_intro": exhibit_intro,
            "section_conclusion": conclusion,
        }
    except Exception as e:
        logger.error(f"Failed to synthesize conclusion: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def _sanitize_filename(s: str, max_len: int = 100) -> str:
    if not s:
        return "document"
    s = re.sub(r'[\\/:*?"<>|]', "_", str(s)).strip()
    s = re.sub(r"\s+", " ", s)
    return s[:max_len] if len(s) > max_len else s


def _get_item_display_name(db: Session, item: UserExhibitItem) -> str:
    return document_builder._get_item_name(db, item)


def _criteria_contains(column, criteria_id: str):
    return cast(column, String).ilike(f"%{criteria_id}%")


def _ensure_export_manifest_table(db: Session) -> None:
    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS user_petition_export_manifest (
                id uuid PRIMARY KEY,
                document_id uuid NOT NULL,
                user_id uuid NOT NULL,
                application_id uuid NULL,
                run_id uuid NOT NULL,
                sort_order integer NOT NULL,
                zip_entry_name text NOT NULL,
                entry_type text NOT NULL,
                storage_path text NULL,
                inline_text text NULL,
                created_at timestamptz DEFAULT now()
            )
            """
        )
    )
    db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS idx_user_petition_export_manifest_document
            ON user_petition_export_manifest(document_id)
            """
        )
    )
    db.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS idx_user_petition_export_manifest_user
            ON user_petition_export_manifest(user_id)
            """
        )
    )


def _write_export_manifest(
    db: Session,
    *,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    application_id: uuid.UUID | None,
    run_id: uuid.UUID,
    petitioner_name: str,
    petition_doc_path: str,
    cover_doc_path: str | None,
) -> dict:
    """
    Build and persist immutable export entries for a generated petition document.
    Export package should read only from this manifest so run->file mapping remains stable.
    """
    exhibit_repo = ExhibitRepository(db)
    document_repo = DocumentRepository(db)

    # Validate run-scoped exhibit mapping exists before persisting the manifest.
    exhibits = exhibit_repo.get_by_run(user_id, run_id)
    if not exhibits:
        raise HTTPException(
            status_code=500,
            detail=f"No exhibits found for generated run {run_id}",
        )

    # Build canonical entry list with deterministic ordering.
    entries: list[dict] = []
    sort_order = 1
    used_zip_names: set[str] = set()

    def _add_entry(
        zip_entry_name: str,
        entry_type: str,
        storage_path: str | None = None,
        inline_text: str | None = None,
    ) -> None:
        nonlocal sort_order
        entries.append(
            {
                "id": str(uuid.uuid4()),
                "document_id": str(document_id),
                "user_id": str(user_id),
                "application_id": str(application_id) if application_id else None,
                "run_id": str(run_id),
                "sort_order": sort_order,
                "zip_entry_name": zip_entry_name,
                "entry_type": entry_type,
                "storage_path": storage_path,
                "inline_text": inline_text,
            }
        )
        sort_order += 1
        used_zip_names.add(zip_entry_name)

    # 01 cover letter + 02-04 placeholders + 05 petition letter.
    if cover_doc_path:
        _add_entry("01 - Cover Letter.docx", "storage_file", storage_path=cover_doc_path)
    else:
        # Keep deterministic behavior even when cover letter generation failed.
        fallback_cover_text = (
            f"Cover letter was unavailable at generation time for {petitioner_name}. "
            "Please regenerate this petition or contact support."
        )
        _add_entry("01 - Cover Letter.txt", "inline_text", inline_text=fallback_cover_text)

    for label, name in [
        ("02", "Form G-1145 E-Notification"),
        ("03", "Form G-28 Notice of Appearance"),
        ("04", "Form I-140 Petition"),
    ]:
        placeholder = f"Add {name} manually before filing.\n"
        _add_entry(f"{label} - {name}.txt", "inline_text", inline_text=placeholder)

    _add_entry("05 - Petition Letter.docx", "storage_file", storage_path=petition_doc_path)

    # 06+ exhibits from this exact run only.
    for idx, exhibit in enumerate(exhibits):
        prefix = f"{6 + idx:02d}"
        title_sanitized = _sanitize_filename(exhibit.title.strip().strip('"').strip())
        items = exhibit_repo.get_items_for_exhibit_ordered(exhibit.id)
        if not items:
            # Root consistency rule: every confirmed exhibit should persist concrete item mappings.
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Exhibit '{exhibit.title}' has no persisted exhibit items for run {run_id}. "
                    "Generation aborted to prevent inconsistent export mapping."
                ),
            )

        for item in items:
            content_rec = None
            file_id = item.file_id
            if not file_id and item.content_id:
                content_rec = document_repo.get_evidence_by_id(item.content_id)
                if content_rec and content_rec.file_id:
                    file_id = content_rec.file_id

            if file_id:
                file_rec = document_repo.get_file(user_id, file_id)
                if not file_rec or not file_rec.file_url:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Exhibit item file reference {file_id} is missing for run {run_id}",
                    )
                display_name = _get_item_display_name(db, item)
                base_name = _sanitize_filename(display_name)
                orig_name = file_rec.file_name or ""
                ext = ""
                if "." in orig_name:
                    ext = "." + orig_name.rsplit(".", 1)[-1].lower()
                elif base_name.endswith((".pdf", ".docx", ".doc")):
                    for e in (".pdf", ".docx", ".doc"):
                        if base_name.lower().endswith(e):
                            ext = e
                            base_name = base_name[: -len(e)]
                            break
                if not ext:
                    ext = ".pdf"

                zip_entry = (
                    f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {base_name}{ext}"
                )
                if zip_entry in used_zip_names:
                    n = 2
                    while True:
                        candidate = (
                            f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {base_name} - {n}{ext}"
                        )
                        if candidate not in used_zip_names:
                            zip_entry = candidate
                            break
                        n += 1

                _add_entry(zip_entry, "storage_file", storage_path=file_rec.file_url)
                continue

            if item.content_id:
                if content_rec is None:
                    content_rec = document_repo.get_evidence_by_id(item.content_id)
                if not content_rec:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Exhibit content reference {item.content_id} is missing for run {run_id}",
                    )
                display_name = _sanitize_filename(content_rec.title or "Evidence Notes")
                content_text = content_rec.content or "No content available for this exhibit item."
                zip_entry = (
                    f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {display_name}.txt"
                )
                if zip_entry in used_zip_names:
                    n = 2
                    while True:
                        candidate = (
                            f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {display_name} - {n}.txt"
                        )
                        if candidate not in used_zip_names:
                            zip_entry = candidate
                            break
                        n += 1
                _add_entry(zip_entry, "inline_text", inline_text=content_text)
                continue

            raise HTTPException(
                status_code=500,
                detail=f"Exhibit item {item.id} has neither file_id nor content_id for run {run_id}",
            )

    # Replace manifest atomically per document_id.
    db.execute(
        text("DELETE FROM user_petition_export_manifest WHERE document_id = :document_id"),
        {"document_id": str(document_id)},
    )
    for e in entries:
        db.execute(
            text(
                """
                INSERT INTO user_petition_export_manifest
                (id, document_id, user_id, application_id, run_id, sort_order, zip_entry_name, entry_type, storage_path, inline_text)
                VALUES
                (:id, :document_id, :user_id, :application_id, :run_id, :sort_order, :zip_entry_name, :entry_type, :storage_path, :inline_text)
                """
            ),
            e,
        )
    return {"entry_count": len(entries)}


async def download_petition_section(
    db: Session,
    current_user: Any,
    run_ids: str,
):
    try:
        exhibit_repo = ExhibitRepository(db)
        draft_repo = PetitionDraftRepository(db)
        criteria_repo = CriteriaDraftRepository(db)
        user_id = uuid.UUID(current_user.id)
        run_id_list = [uuid.UUID(rid.strip()) for rid in run_ids.split(",")]
        seen = set()
        run_id_list = [x for x in run_id_list if not (x in seen or seen.add(x))]

        section_docs = []
        user_name = current_user.user_metadata.get("name", "The Petitioner")

        standard_order = [
            "personal_info",
            "awards",
            "membership",
            "published_material",
            "judging",
            "contributions",
            "scholarly",
            "exhibitions",
            "leading",
            "salary",
            "commercial",
            "recommendation",
            "future_work",
        ]
        global_exhibit_counter = 1
        section_idx = 0

        has_personal_info = exhibit_repo.has_personal_info(user_id, run_id_list)

        if has_personal_info:
            global_exhibit_counter = 2

        for run_id in run_id_list:
            run_criteria = exhibit_repo.distinct_criteria_for_run(user_id, run_id)
            run_criteria.sort(
                key=lambda x: standard_order.index((x or "").lower())
                if (x or "").lower() in standard_order
                else 999
            )

            import string
            for criteria_id in run_criteria:
                exhibits = exhibit_repo.get_by_run_and_criteria(user_id, run_id, criteria_id)

                if not exhibits:
                    continue

                if criteria_id == "personal_info":
                    continue

                current_section_letter = string.ascii_uppercase[section_idx]
                section_idx += 1

                display_exhibits = []
                for ex in exhibits:
                    display_exhibits.append(SimpleNamespace(
                        id=ex.id,
                        user_id=ex.user_id,
                        application_id=ex.application_id,
                        run_id=ex.run_id,
                        criteria_id=ex.criteria_id,
                        section_letter=current_section_letter,
                        exhibit_number=global_exhibit_counter,
                        title=ex.title,
                        summary=ex.summary,
                        draft_content=ex.draft_content,
                        created_at=ex.created_at,
                    ))
                    global_exhibit_counter += 1

                criteria_draft = criteria_repo.get_by_run_and_criteria(run_id, criteria_id)

                conclusion = criteria_draft.section_conclusion if criteria_draft else ""
                exhibit_intro = criteria_draft.section_intro if criteria_draft else ""

                if not section_docs:
                    petition_draft = draft_repo.get_intro(run_id)

                    if not petition_draft:
                        try:
                            logger.info(f"Petition intro missing for run {run_id}, generating on the fly...")
                            petition_intro = await drafter.draft_petition_intro(db, user_id, user_name)
                            if petition_intro:
                                profile = profile_service.get_profile(db, user_id)
                                run_exhibit = exhibit_repo.get_last_run_exhibit(user_id, run_id)
                                new_draft = UserPetitionDraft(
                                    run_id=run_id,
                                    user_id=user_id,
                                    application_id=run_exhibit.application_id if run_exhibit else exhibits[0].application_id,
                                    section="intro",
                                    section_content=petition_intro,
                                    rag_field=profile.field if profile else None,
                                    rag_occupation=profile.occupation if profile else None,
                                )
                                draft_repo.upsert_intro(new_draft)
                                try:
                                    db.commit()
                                except Exception as commit_err:
                                    db.rollback()
                                    logger.error(f"Failed to persist petition intro draft: {commit_err}")
                                    raise
                                petition_draft = new_draft
                        except Exception as e:
                            logger.error(f"Failed to generate petition intro on the fly: {e}")

                    if petition_draft and petition_draft.section_content:
                        try:
                            petition_intro_doc = document_builder.generate_petition_intro(
                                petition_draft.section_content,
                                db,
                                user_id,
                            )
                            section_docs.append(petition_intro_doc)
                            logger.info("Added petition intro to combined document")
                        except Exception as e:
                            logger.error(f"Failed to generate petition intro document: {e}")

                section_doc = document_builder.generate_section(
                    db,
                    criteria_id,
                    display_exhibits,
                    conclusion,
                    user_name,
                    exhibit_intro,
                )
                section_docs.append(section_doc)

        if not section_docs:
            raise HTTPException(status_code=404, detail="No valid runs found to download")

        try:
            petition_conclusion = await drafter.draft_petition_conclusion(
                db=db,
                user_id=user_id,
                run_ids=run_id_list,
                user_name=user_name,
            )
            if petition_conclusion and petition_conclusion.strip():
                last_run_id = run_id_list[-1]
                existing_conclusion = draft_repo.get_conclusion(last_run_id)

                if existing_conclusion:
                    existing_conclusion.section_content = petition_conclusion
                    if not existing_conclusion.application_id:
                        last_run_exhibit = exhibit_repo.get_last_run_exhibit(user_id, last_run_id)
                        if not last_run_exhibit:
                            raise HTTPException(status_code=404, detail=f"No exhibits found for run {last_run_id}")
                        existing_conclusion.application_id = last_run_exhibit.application_id
                else:
                    profile = profile_service.get_profile(db, user_id)
                    last_run_exhibit = exhibit_repo.get_last_run_exhibit(user_id, last_run_id)
                    if not last_run_exhibit:
                        raise HTTPException(status_code=404, detail=f"No exhibits found for run {last_run_id}")
                    db.add(UserPetitionDraft(
                        run_id=last_run_id,
                        user_id=user_id,
                        application_id=last_run_exhibit.application_id,
                        section="conclusion",
                        section_content=petition_conclusion,
                        rag_field=profile.field if profile else None,
                        rag_occupation=profile.occupation if profile else None,
                    ))
                try:
                    db.commit()
                except Exception as commit_err:
                    db.rollback()
                    logger.error(f"Failed to persist petition conclusion draft: {commit_err}")
                    raise

                conclusion_doc = document_builder.generate_petition_conclusion(petition_conclusion)
                section_docs.append(conclusion_doc)
                logger.info("Added petition conclusion to combined document")
        except Exception as conclusion_error:
            logger.error(f"Failed to generate petition conclusion: {conclusion_error}")
            db.rollback()
            try:
                fallback_run_id = run_id_list[-1]
                cached_conclusion = draft_repo.get_conclusion(fallback_run_id)
                if cached_conclusion and cached_conclusion.section_content:
                    section_docs.append(
                        document_builder.generate_petition_conclusion(cached_conclusion.section_content)
                    )
                    logger.info("Added cached petition conclusion fallback to combined document")
            except Exception as cached_conclusion_error:
                logger.error(f"Failed to append cached petition conclusion fallback: {cached_conclusion_error}")

        file_stream = document_builder.combine_sections(section_docs)

        return StreamingResponse(
            file_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": "attachment; filename=petition_sections.docx",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        logger.error(f"Failed to build document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def generate_final_document(
    db: Session,
    current_user: Any,
    run_ids: List[uuid.UUID],
    application_id: uuid.UUID = None,
    version_label: str = None,
    title: str = None,
):
    try:
        run_repo = PetitionRunRepository(db)
        doc_repo = PetitionDocumentRepository(db)
        user_id = uuid.UUID(current_user.id)
        if not run_ids:
            raise HTTPException(status_code=400, detail="run_ids is required")

        run_ids_csv = ",".join(str(rid) for rid in run_ids)
        stream_response = await download_petition_section(db, current_user, run_ids_csv)

        if not isinstance(stream_response, StreamingResponse):
            raise HTTPException(status_code=500, detail="Failed to generate final document stream")

        payload = bytearray()
        async for chunk in stream_response.body_iterator:
            payload.extend(chunk)
        file_bytes = bytes(payload)
        if not file_bytes:
            raise HTTPException(status_code=500, detail="Generated final document is empty")

        db.execute(text("""
            CREATE TABLE IF NOT EXISTS user_petition_documents (
                id uuid PRIMARY KEY,
                user_id uuid NOT NULL,
                application_id uuid NULL,
                run_id uuid NOT NULL,
                document_type text NOT NULL DEFAULT 'petition',
                file_path text NOT NULL,
                file_name text NOT NULL,
                mime_type text NOT NULL,
                file_size integer NULL,
                status text NOT NULL DEFAULT 'ready',
                created_at timestamptz DEFAULT now()
            )
        """))
        db.commit()

        last_run_id = run_ids[-1]
        effective_application_id = application_id
        if not effective_application_id:
            run_rec = run_repo.get_by_id(last_run_id, user_id)
            effective_application_id = run_rec.application_id if run_rec else None

        timestamp = int(__import__("time").time())
        file_name = f"petition_{timestamp}.docx"
        file_path = f"{user_id}/{effective_application_id or 'no-application'}/generated_documents/{last_run_id}/{file_name}"
        mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        storage_gateway = get_supabase_storage_gateway()
        log_event(
            logger,
            "petition_generation_start",
            user_id=user_id,
            run_id=last_run_id,
            application_id=effective_application_id,
            file_path=file_path,
        )
        petition_uploaded = False
        try:
            storage_gateway.upload(file_path, file_bytes, mime_type)
            petition_uploaded = True

            doc_row = UserPetitionDocument(
                user_id=user_id,
                application_id=effective_application_id,
                run_id=last_run_id,
                document_type="petition",
                file_path=file_path,
                file_name=file_name,
                mime_type=mime_type,
                file_size=len(file_bytes),
                status="ready",
            )
            doc_repo.add(doc_row)
            db.commit()
            db.refresh(doc_row)
            log_event(
                logger,
                "petition_generation_committed",
                user_id=user_id,
                run_id=last_run_id,
                document_id=doc_row.id,
                file_path=file_path,
            )
        except Exception:
            db.rollback()
            if petition_uploaded:
                try:
                    storage_gateway.delete(file_path)
                except Exception as cleanup_err:
                    logger.warning(f"Failed to cleanup petition document after DB failure: {cleanup_err}")
            raise

        cover_letter_document_id = None
        cover_file_path = None
        petitioner_name = (current_user.user_metadata or {}).get("name") or (current_user.user_metadata or {}).get("full_name") or "The Petitioner"
        try:
            cover_bytes = build_cover_letter_bytes(
                db,
                run_id=last_run_id,
                user_id=user_id,
                petitioner_name=petitioner_name,
            )
            ts = int(__import__("time").time())
            cover_file_name = f"cover_letter_{ts}.docx"
            cover_file_path = f"{user_id}/{effective_application_id or 'no-application'}/generated_documents/{last_run_id}/{cover_file_name}"
            cover_uploaded = False
            try:
                storage_gateway.upload(cover_file_path, cover_bytes, mime_type)
                cover_uploaded = True
                cover_row = UserPetitionDocument(
                    user_id=user_id,
                    application_id=effective_application_id,
                    run_id=last_run_id,
                    document_type="cover_letter",
                    file_path=cover_file_path,
                    file_name=cover_file_name,
                    mime_type=mime_type,
                    file_size=len(cover_bytes),
                    status="ready",
                )
                doc_repo.add(cover_row)
                db.commit()
                db.refresh(cover_row)
                cover_file_path = cover_row.file_path
            except Exception:
                db.rollback()
                if cover_uploaded:
                    try:
                        storage_gateway.delete(cover_file_path)
                    except Exception as cleanup_err:
                        logger.warning(f"Failed to cleanup cover letter after DB failure: {cleanup_err}")
                raise
            cover_letter_document_id = str(cover_row.id)
        except Exception as cover_err:
            logger.warning(f"Cover letter generation failed (petition saved): {cover_err}")

        try:
            _ensure_export_manifest_table(db)
            manifest_meta = _write_export_manifest(
                db,
                document_id=doc_row.id,
                user_id=user_id,
                application_id=effective_application_id,
                run_id=last_run_id,
                petitioner_name=petitioner_name,
                petition_doc_path=doc_row.file_path,
                cover_doc_path=cover_file_path,
            )
            db.commit()
            log_event(
                logger,
                "petition_export_manifest_committed",
                user_id=user_id,
                run_id=last_run_id,
                document_id=doc_row.id,
                entry_count=manifest_meta.get("entry_count", 0),
            )
        except Exception as manifest_err:
            db.rollback()
            logger.error(f"Failed to persist export manifest: {manifest_err}")
            # Best-effort cleanup so failed generations don't leave partially
            # persisted documents without a stable export mapping.
            try:
                if doc_row and doc_row.file_path:
                    storage_gateway.delete(doc_row.file_path)
            except Exception as cleanup_err:
                logger.warning(f"Failed to cleanup petition document after manifest error: {cleanup_err}")
            try:
                if cover_file_path:
                    storage_gateway.delete(cover_file_path)
            except Exception as cleanup_err:
                logger.warning(f"Failed to cleanup cover letter after manifest error: {cleanup_err}")
            try:
                db.execute(
                    text("DELETE FROM user_petition_documents WHERE id = :id AND user_id = :user_id"),
                    {"id": str(doc_row.id), "user_id": str(user_id)},
                )
                if cover_letter_document_id:
                    db.execute(
                        text("DELETE FROM user_petition_documents WHERE id = :id AND user_id = :user_id"),
                        {"id": str(cover_letter_document_id), "user_id": str(user_id)},
                    )
                db.commit()
            except Exception as cleanup_err:
                db.rollback()
                logger.warning(f"Failed to cleanup petition document rows after manifest error: {cleanup_err}")
            raise

        run_rec = run_repo.get_by_id(last_run_id, user_id)
        if run_rec:
            run_rec.status = "ready"
            try:
                db.commit()
                log_event(logger, "petition_run_status_updated", user_id=user_id, run_id=last_run_id, status="ready")
            except Exception as run_err:
                db.rollback()
                logger.warning(f"Failed to mark petition run ready: {run_err}")
        else:
            logger.warning(f"Run not found when marking ready: run_id={last_run_id}")

        return {
            "status": "success",
            "document_id": str(doc_row.id),
            "cover_letter_document_id": cover_letter_document_id,
            "run_id": str(last_run_id),
            "application_id": str(effective_application_id) if effective_application_id else None,
            "file_name": file_name,
            "file_size": len(file_bytes),
        }
    except Exception as e:
        logger.error(f"Failed to generate/persist final petition document: {e}")
        db.rollback()
        try:
            user_id = uuid.UUID(current_user.id)
            for run_id in run_ids:
                run_rec = run_repo.get_by_id(run_id, user_id)
                if run_rec and run_rec.status == "generating":
                    run_rec.status = "error"
            try:
                db.commit()
                log_event(logger, "petition_run_status_updated", user_id=user_id, run_id=run_id, status="error")
            except Exception as commit_err:
                db.rollback()
                logger.warning(f"Failed to mark run status as error: {commit_err}")
        except Exception as mark_err:
            logger.warning(f"Could not mark run status as error: {mark_err}")
        raise HTTPException(status_code=500, detail=str(e))


def list_user_petition_documents(
    db: Session,
    current_user: Any,
    application_id: Optional[uuid.UUID] = None,
):
    try:
        doc_repo = PetitionDocumentRepository(db)
        user_id = uuid.UUID(current_user.id)
        rows = doc_repo.list_for_user(user_id, application_id=application_id)
        return {
            "documents": [
                {
                    "id": str(r.id),
                    "run_id": str(r.run_id),
                    "application_id": str(r.application_id) if r.application_id else None,
                    "document_type": getattr(r, "document_type", "petition") or "petition",
                    "file_name": r.file_name,
                    "file_size": r.file_size,
                    "status": r.status,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in rows
            ]
        }
    except Exception as e:
        logger.error(f"Failed to list user petition documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def list_in_progress_runs(
    db: Session,
    current_user: Any,
    application_id: Optional[uuid.UUID] = None,
):
    try:
        run_repo = PetitionRunRepository(db)
        doc_repo = PetitionDocumentRepository(db)
        user_id = uuid.UUID(current_user.id)
        runs = run_repo.list_by_status(user_id, ["generating", "error"], application_id=application_id)

        completed_run_ids = doc_repo.distinct_run_ids_for_user(user_id)
        stuck = [r for r in runs if r.id not in completed_run_ids]

        return {
            "runs": [
                {
                    "id": str(r.id),
                    "application_id": str(r.application_id) if r.application_id else None,
                    "criteria_id": r.criteria_id,
                    "status": r.status,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in stuck
            ]
        }
    except Exception as e:
        logger.error(f"Failed to list in-progress runs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_export_package_manifest(
    db: Session,
    current_user: Any,
    document_id: uuid.UUID,
):
    """
    Return immutable package entries for a generated petition document.
    Source of truth for Export Package UI preview.
    """
    try:
        user_id = uuid.UUID(current_user.id)
        doc_repo = PetitionDocumentRepository(db)
        petition_doc = doc_repo.get_petition(document_id, user_id)
        if not petition_doc:
            raise HTTPException(status_code=404, detail="Petition document not found")

        _ensure_export_manifest_table(db)
        rows = db.execute(
            text(
                """
                SELECT sort_order, zip_entry_name, entry_type, storage_path, inline_text
                FROM user_petition_export_manifest
                WHERE document_id = :document_id AND user_id = :user_id
                ORDER BY sort_order ASC
                """
            ),
            {"document_id": str(document_id), "user_id": str(user_id)},
        ).mappings().all()

        return {
            "document_id": str(document_id),
            "run_id": str(petition_doc.run_id),
            "entries": [
                {
                    "sort_order": int(r["sort_order"]),
                    "zip_entry_name": r["zip_entry_name"],
                    "entry_type": r["entry_type"],
                    "storage_path": r["storage_path"],
                    "has_inline_text": bool(r["inline_text"]),
                }
                for r in rows
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch export package manifest: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def export_package(
    db: Session,
    current_user: Any,
    document_id: uuid.UUID,
):
    try:
        exhibit_repo = ExhibitRepository(db)
        doc_repo = PetitionDocumentRepository(db)
        document_repo = DocumentRepository(db)
        user_id = uuid.UUID(current_user.id)
        petitioner_name = (current_user.user_metadata or {}).get("name") or (current_user.user_metadata or {}).get("full_name") or "The Petitioner"

        petition_doc = doc_repo.get_petition(document_id, user_id)
        if not petition_doc:
            raise HTTPException(status_code=404, detail="Petition document not found")
        run_id = petition_doc.run_id

        storage_gateway = get_supabase_storage_gateway()

        def download_storage(path: str) -> bytes:
            return storage_gateway.download(path)

        # Preferred path: immutable export manifest for this exact document_id.
        try:
            _ensure_export_manifest_table(db)
            manifest_rows = db.execute(
                text(
                    """
                    SELECT sort_order, zip_entry_name, entry_type, storage_path, inline_text
                    FROM user_petition_export_manifest
                    WHERE document_id = :document_id AND user_id = :user_id
                    ORDER BY sort_order ASC
                    """
                ),
                {"document_id": str(document_id), "user_id": str(user_id)},
            ).mappings().all()
        except Exception:
            manifest_rows = []

        if manifest_rows:
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for row in manifest_rows:
                    entry_name = row["zip_entry_name"]
                    entry_type = row["entry_type"]
                    if entry_type == "storage_file":
                        storage_path = row["storage_path"]
                        if not storage_path:
                            raise HTTPException(
                                status_code=500,
                                detail=f"Manifest storage path missing for {entry_name}",
                            )
                        zf.writestr(entry_name, download_storage(storage_path))
                    elif entry_type == "inline_text":
                        zf.writestr(entry_name, (row["inline_text"] or "").encode("utf-8"))
                    else:
                        raise HTTPException(
                            status_code=500,
                            detail=f"Unknown manifest entry_type '{entry_type}' for {entry_name}",
                        )

            buf.seek(0)
            filename = f"Petition_Package_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.zip"
            return StreamingResponse(
                buf,
                media_type="application/zip",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "Access-Control-Expose-Headers": "Content-Disposition",
                },
            )

        # Legacy fallback for documents generated before manifest was introduced.
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            cover_doc = doc_repo.list_cover_letters_for_run(run_id, user_id)
            if cover_doc:
                cover_bytes = download_storage(cover_doc.file_path)
            else:
                cover_bytes = build_cover_letter_bytes(db, run_id=run_id, user_id=user_id, petitioner_name=petitioner_name)
            zf.writestr("01 - Cover Letter.docx", cover_bytes)

            for label, name in [
                ("02", "Form G-1145 E-Notification"),
                ("03", "Form G-28 Notice of Appearance"),
                ("04", "Form I-140 Petition"),
            ]:
                placeholder = f"Add {name} manually before filing.\n"
                zf.writestr(f"{label} - {name}.txt", placeholder.encode("utf-8"))

            petition_bytes = download_storage(petition_doc.file_path)
            zf.writestr("05 - Petition Letter.docx", petition_bytes)

            exhibits = exhibit_repo.get_by_run(user_id, run_id)
            # If this run has sparse/missing exhibit items, fall back to the
            # richest run for the same application to avoid empty exports.
            if petition_doc.application_id:
                current_item_count = (
                    db.query(func.count(UserExhibitItem.id))
                    .join(UserExhibit, UserExhibitItem.exhibit_id == UserExhibit.id)
                    .filter(
                        UserExhibit.user_id == user_id,
                        UserExhibit.run_id == run_id,
                    )
                    .scalar()
                    or 0
                )
                alt_run = (
                    db.query(
                        UserExhibit.run_id,
                        func.count(UserExhibitItem.id).label("item_cnt"),
                        func.max(UserExhibit.created_at).label("latest"),
                    )
                    .join(UserExhibitItem, UserExhibitItem.exhibit_id == UserExhibit.id)
                    .filter(
                        UserExhibit.user_id == user_id,
                        UserExhibit.application_id == petition_doc.application_id,
                    )
                    .group_by(UserExhibit.run_id)
                    .order_by(desc("item_cnt"), desc("latest"))
                    .first()
                )
                if (
                    alt_run
                    and alt_run.run_id
                    and alt_run.run_id != run_id
                    and (len(exhibits) == 0 or alt_run.item_cnt > current_item_count)
                ):
                    logger.info(
                        "Export package using alternate run_id with more exhibit items",
                        extra={
                            "document_run_id": str(run_id),
                            "alternate_run_id": str(alt_run.run_id),
                            "document_exhibit_count": len(exhibits),
                            "document_item_count": int(current_item_count),
                            "alternate_item_count": int(alt_run.item_cnt),
                        },
                    )
                    exhibits = exhibit_repo.get_by_run(user_id, alt_run.run_id)
            personal_categories = ["Personal Information", "future_plan"]
            for idx, exhibit in enumerate(exhibits):
                prefix = f"{6 + idx:02d}"
                title_sanitized = _sanitize_filename(exhibit.title.strip().strip('"').strip())
                items = exhibit_repo.get_items_for_exhibit_ordered(exhibit.id)
                used_entry_names = set()
                written_entries = 0
                for item in items:
                    content_rec = None
                    file_id = item.file_id
                    if not file_id and item.content_id:
                        content_rec = document_repo.get_evidence_by_id(item.content_id)
                        if content_rec and content_rec.file_id:
                            file_id = content_rec.file_id

                    if file_id:
                        try:
                            file_bytes, orig_name = document_service.get_file_bytes(db, user_id, file_id)
                        except Exception as e:
                            logger.warning(f"Skipping exhibit item file {file_id}: {e}")
                            continue
                        display_name = _get_item_display_name(db, item)
                        base_name = _sanitize_filename(display_name)
                        ext = ""
                        if "." in orig_name:
                            ext = "." + orig_name.rsplit(".", 1)[-1].lower()
                        elif base_name.endswith((".pdf", ".docx", ".doc")):
                            for e in (".pdf", ".docx", ".doc"):
                                if base_name.lower().endswith(e):
                                    ext = e
                                    base_name = base_name[: -len(e)]
                                    break
                        if not ext:
                            ext = ".pdf"
                        zip_entry = f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {base_name}{ext}"
                        if zip_entry in used_entry_names:
                            n = 2
                            while True:
                                zip_entry = f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {base_name} - {n}{ext}"
                                if zip_entry not in used_entry_names:
                                    break
                                n += 1
                        used_entry_names.add(zip_entry)
                        zf.writestr(zip_entry, file_bytes)
                        written_entries += 1
                        continue

                    if item.content_id:
                        if content_rec is None:
                            content_rec = document_repo.get_evidence_by_id(item.content_id)
                        if not content_rec:
                            continue
                        display_name = _sanitize_filename(content_rec.title or "Evidence Notes")
                        content_text = content_rec.content or ""
                        if not content_text:
                            content_text = "No content available for this exhibit item."
                        ext = ".txt"
                        zip_entry = f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {display_name}{ext}"
                        if zip_entry in used_entry_names:
                            n = 2
                            while True:
                                zip_entry = f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {display_name} - {n}{ext}"
                                if zip_entry not in used_entry_names:
                                    break
                                n += 1
                        used_entry_names.add(zip_entry)
                        zf.writestr(zip_entry, content_text.encode("utf-8"))
                        written_entries += 1

                # Only skip fallback when at least one exhibit item was actually
                # written to the ZIP. If item references exist but all failed to
                # resolve/download, fallback by criteria to avoid missing exhibits.
                if items and written_entries > 0:
                    continue

                # Fallback: include files by criteria if no exhibit items were persisted.
                file_query = db.query(UserFile).filter(UserFile.user_id == user_id)
                if petition_doc.application_id:
                    file_query = file_query.filter(UserFile.application_id == petition_doc.application_id)
                if exhibit.criteria_id == "personal_info":
                    file_query = file_query.filter(
                        or_(
                            _criteria_contains(UserFile.criteria, "personal_info"),
                            and_(UserFile.criteria.is_(None), UserFile.category.in_(personal_categories)),
                        )
                    )
                else:
                    file_query = file_query.filter(_criteria_contains(UserFile.criteria, exhibit.criteria_id))
                fallback_files = file_query.all()
                for fallback in fallback_files:
                    try:
                        file_bytes, orig_name = document_service.get_file_bytes(db, user_id, fallback.id)
                    except Exception as e:
                        logger.warning(f"Skipping fallback file {fallback.id}: {e}")
                        continue
                    base_name = _sanitize_filename(fallback.file_name or "document")
                    ext = ""
                    if "." in (orig_name or ""):
                        ext = "." + orig_name.rsplit(".", 1)[-1].lower()
                    if not ext:
                        ext = ".pdf"
                    zip_entry = f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {base_name}{ext}"
                    if zip_entry in used_entry_names:
                        n = 2
                        while True:
                            zip_entry = f"{prefix} - Exhibit {exhibit.exhibit_number} - {title_sanitized} - {base_name} - {n}{ext}"
                            if zip_entry not in used_entry_names:
                                break
                            n += 1
                    used_entry_names.add(zip_entry)
                    zf.writestr(zip_entry, file_bytes)
                    written_entries += 1

        buf.seek(0)
        filename = f"Petition_Package_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.zip"
        return StreamingResponse(
            buf,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export package failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def download_final_document(
    db: Session,
    current_user: Any,
    document_id: uuid.UUID,
):
    try:
        user_id = uuid.UUID(current_user.id)
        doc_repo = PetitionDocumentRepository(db)
        doc_row = doc_repo.get_by_id(document_id, user_id)
        if not doc_row:
            raise HTTPException(status_code=404, detail="Generated document not found")

        storage_gateway = get_supabase_storage_gateway()
        file_bytes = storage_gateway.download(doc_row.file_path)
        if not isinstance(file_bytes, (bytes, bytearray)) or len(file_bytes) == 0:
            raise HTTPException(status_code=500, detail="Failed to download generated document bytes")

        return StreamingResponse(
            io.BytesIO(bytes(file_bytes)),
            media_type=doc_row.mime_type or "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={doc_row.file_name or 'petition.docx'}",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download final petition document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def download_petition_intro(
    db: Session,
    current_user: Any,
):
    try:
        user_id = uuid.UUID(current_user.id)
        user_name = current_user.user_metadata.get("name", "The Petitioner")

        intro_text = await drafter.draft_petition_intro(db, user_id, user_name)
        if not isinstance(intro_text, str):
            logger.error(f"draft_petition_intro returned non-string: {type(intro_text)}, value: {intro_text}")
            intro_text = str(intro_text) if intro_text is not None else ""

        intro_doc = document_builder.generate_petition_intro(intro_text, db, user_id)
        file_stream = document_builder.combine_sections([intro_doc])

        return StreamingResponse(
            file_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": "attachment; filename=petition_intro.docx",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        import traceback
        logger.error(f"Failed to build petition intro: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
