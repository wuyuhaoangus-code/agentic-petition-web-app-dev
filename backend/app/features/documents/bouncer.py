import logging
import json
import uuid
import string
import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, not_, cast, String
from app.features.documents.models import UserFile, UserEvidenceContent, UserExhibit, UserExhibitItem, PetitionRun
from app.features.documents.repositories import DocumentRepository
from app.features.documents.service import document_service
from app.features.petitions.repositories import ExhibitRepository, PetitionRunRepository
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

class BouncerAgent:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    def _criteria_contains(self, column, criteria_id: str):
        """
        Robust criteria filter across text/json/array DB representations.
        We cast to text and apply ILIKE to avoid type-specific operator issues.
        """
        return cast(column, String).ilike(f"%{criteria_id}%")

    async def analyze_profile(self, basic_info_content: str) -> Dict[str, str]:
        """
        Analyzes the petitioner's basic info (CV/Resume) to extract structured profile data.
        """
        prompt = f"""
        You are an EB-1A immigration expert. Analyze the following petitioner's background information (CV/Resume) 
        and extract their core professional identity.
        
        BACKGROUND INFO:
        {basic_info_content[:8000]}
        
        INSTRUCTIONS:
        1. Extract the First Name and Last Name.
        2. Identify their specific Field of Endeavor (e.g., "Gaming Industry", "Oncology Research", "FinTech"). Be concise but descriptive.
        3. Identify their current or primary Occupation (e.g., "Senior Product Manager", "Principal Investigator", "Lead Software Engineer").
        
        Return the result in JSON format.
        """

        response_schema = {
            "type": "OBJECT",
            "properties": {
                "first_name": {"type": "STRING"},
                "last_name": {"type": "STRING"},
                "field": {"type": "STRING"},
                "occupation": {"type": "STRING"}
            },
            "required": ["first_name", "last_name", "field", "occupation"]
        }

        try:
            response = self.client.models.generate_content(
                model=settings.GEMINI_PRO_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.1,
                )
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Profile analysis failed: {e}")
            return {}


    async def group_into_exhibits(
        self,
        db: Session,
        user_id: uuid.UUID,
        criteria_id: str,
        user_name: str,
        run_id: uuid.UUID = None,
        verified_data: List[Dict] = None,
        application_id: uuid.UUID = None,
    ) -> List[UserExhibit]:
        """
        Groups evidence into "Evidence Clusters" and generates professional headers.
        If verified_data is provided, it uses that instead of calling the LLM.
        """
        repo = DocumentRepository(db)
        exhibit_repo = ExhibitRepository(db)
        run_repo = PetitionRunRepository(db)
        # 0. Clean up existing exhibits for this criteria before creating new ones
        # This prevents duplicates when user confirms exhibits multiple times
        existing = exhibit_repo.list_for_criteria(
            user_id,
            criteria_id,
            application_id=application_id,
            run_id=run_id,
        )
        for ex in existing:
            # Delete associated exhibit items first (foreign key constraint)
            exhibit_repo.delete_items_for_exhibit(ex.id)
            exhibit_repo.delete_exhibit(ex)
        db.flush()

        # Special Handling for "personal_info" (Exhibit 1) and "future_work" (Last Exhibit)
        is_special_grouping = criteria_id in ["personal_info", "future_work"]
        
        verified_ids: List[uuid.UUID] = []
        if verified_data:
            for e in verified_data:
                for raw_id in e.get("doc_ids", []):
                    try:
                        verified_ids.append(uuid.UUID(raw_id))
                    except Exception:
                        continue

        if criteria_id == "personal_info":
            personal_categories = [
                "Personal Information",
                "basicInfo",
                "resumeCV",
                "graduation_certificates",
                "employment_verification",
                "other_personalinfo",
            ]
            # Match files with criteria containing 'personal_info', or legacy (null criteria + personal category).
            # Do not filter by application_id so we find personal files even if stored with null/different app.
            files_q = repo.files_query().filter(
                UserFile.user_id == user_id,
                or_(
                    self._criteria_contains(UserFile.criteria, "personal_info"),
                    and_(UserFile.criteria.is_(None), UserFile.category.in_(personal_categories)),
                )
            )
            files = files_q.all()

            content_q = repo.evidence_query().filter(
                UserEvidenceContent.user_id == user_id,
                or_(
                    self._criteria_contains(UserEvidenceContent.criteria, "personal_info"),
                    and_(UserEvidenceContent.criteria.is_(None), UserEvidenceContent.category.in_(personal_categories)),
                )
            )
            content_entries = content_q.all()

            if not files and not content_entries:
                logger.info(
                    "personal_info: no files or content found (user_id=%s). criteria column may not contain 'personal_info'.",
                    user_id
                )
            
        elif criteria_id == "future_work":
            # Fetch files with criteria containing "future_work"
            # AND category linked to personal planning uploads.
            files = repo.files_query().filter(
                UserFile.user_id == user_id,
                self._criteria_contains(UserFile.criteria, "future_work"),
                UserFile.category.in_(["Personal Information", "future_plan"])
            ).all()
            
            content_entries = repo.evidence_query().filter(
                UserEvidenceContent.user_id == user_id,
                self._criteria_contains(UserEvidenceContent.criteria, "future_work"),
                UserEvidenceContent.category.in_(["Personal Information", "future_plan"])
            ).all()
            
        else:
            # Standard criteria filtering, unless verified doc_ids provided.
            if verified_ids:
                files = repo.files_query().filter(
                    UserFile.user_id == user_id,
                    UserFile.id.in_(verified_ids)
                ).all()
                content_entries = repo.evidence_query().filter(
                    UserEvidenceContent.user_id == user_id,
                    UserEvidenceContent.id.in_(verified_ids)
                ).all()
            else:
                criteria_filter = self._criteria_contains(UserFile.criteria, criteria_id)
                content_criteria_filter = self._criteria_contains(UserEvidenceContent.criteria, criteria_id)

                files = repo.files_query().filter(
                    UserFile.user_id == user_id,
                    criteria_filter
                ).all()
                
                # ... (deduplication logic stays same) ...
                content_entries = repo.evidence_query().filter(
                    UserEvidenceContent.user_id == user_id,
                    content_criteria_filter
                ).all()

        if not files and not content_entries:
            return []

        if verified_data:
            exhibit_data = verified_data
        elif is_special_grouping:
            # Force create ONE exhibit for special groups without LLM
            doc_ids = []
            files_with_content = {c.file_id for c in content_entries if c.file_id}
            
            # Collect all doc IDs
            for c in content_entries:
                doc_ids.append(str(c.id))
            for f in files:
                if f.id not in files_with_content:
                    doc_ids.append(str(f.id))
            
            if criteria_id == "personal_info":
                title = "Background Information about Petitioner"
                summary = "Curriculum Vitae, Degrees, and Employment Verification"
            else:
                title = "Future Work Plan"
                summary = f"Detailed plan describing {user_name}'s proposed future work in the United States"
                
            exhibit_data = [{
                "achievement_name": title,
                "search_query": summary,
                "doc_ids": doc_ids,
                "translated_titles": [] # No translation needed for internal grouping
            }]
        else:
            # Deduplicate and prepare doc list for LLM
            doc_list = []
            files_with_content = {c.file_id for c in content_entries if c.file_id}
            
            for c in content_entries:
                doc_list.append({
                    "id": str(c.id),
                    "type": "content",
                    "title": c.title,
                    "is_file_based": c.file_id is not None,
                    "snippet": c.content[:4000] if c.content else ""
                })
                
            for f in files:
                if f.id not in files_with_content:
                    doc_list.append({
                        "id": str(f.id),
                        "type": "file",
                        "title": f.file_name
                    })

            prompt = f"""
            You are a high-reasoning EB-1A immigration expert. Your task is to analyze documents and group them into logical "Evidence Clusters" for the criteria: '{criteria_id}'.
            
            CORE LOGIC:
            - ONE EXHIBIT PER DISTINCT ACHIEVEMENT/ORGANIZATION: Each cluster must represent exactly ONE core achievement (one award, one membership org, one publication, one role, etc.). Do NOT combine different achievements or different organizations into a single exhibit. Example: "Membership in INFORMS" and "Membership in TSL" = TWO exhibits; "Nobel Prize" and "IEEE Award" = TWO exhibits.
            - SUBJECT-PROOF CONSOLIDATION: Documents that prove the SAME achievement belong together (e.g., certificate + press release + letter all for the same award or same org = ONE exhibit).
            - When in doubt: if two items are different achievements or different orgs, use separate clusters. Only group documents that clearly support the same single achievement.

            GOLDEN EXAMPLE (Few-Shot Anchor):
            Cluster: "Forbes 30 Under 30"
            - Documents: [UUID for "Selection Certificate", UUID for "Forbes Press Release", UUID for "MIT Spotlight article"]
            - Result: ONE Exhibit cluster (all prove the same achievement).

            User Name: {user_name}
            Documents to group: {json.dumps(doc_list, indent=2)}
            
            INSTRUCTIONS:
            1. Order clusters by descending order of EB-1A importance/prestige.
            2. Within each cluster, the first doc_id MUST be the primary proof (e.g., the Certificate or Award).
            3. TRANSLATION: Every "achievement_name" and the "title" within "translated_titles" MUST be in professional English. Translate Chinese or foreign characters based on the document content.
            """

            response_schema = {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "achievement_name": {"type": "STRING"},
                        "search_query": {"type": "STRING"},
                        "year": {"type": "STRING"},
                        "summary": {"type": "STRING"},
                        "doc_ids": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "translated_titles": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "doc_id": {"type": "STRING"},
                                    "title": {"type": "STRING"}
                                },
                                "required": ["doc_id", "title"]
                            }
                        }
                    },
                    "required": ["achievement_name", "search_query", "doc_ids", "translated_titles"]
                }
            }

            try:
                response = self.client.models.generate_content(
                    model=settings.GEMINI_PRO_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=response_schema,
                        temperature=0.7,
                    )
                )
                exhibit_data = json.loads(response.text)
            except Exception as e:
                logger.error(f"LLM exhibit grouping failed: {e}")
                raise

        # 1. Determine Run and Sequence Numbering
        try:
            if not run_id:
                if not application_id:
                    raise ValueError("application_id is required to create a new petition run")
                new_run = PetitionRun(
                    user_id=user_id,
                    application_id=application_id,
                    criteria_id=criteria_id,
                    status="generating"
                )
                db.add(new_run)
                db.flush()
                run_id = new_run.id
                start_exhibit_num = 1
                start_section_idx = 0
            else:
                # If caller provides run_id, use its existing run/application context.
                existing_run = run_repo.get_by_id(run_id, user_id)
                if existing_run and not application_id:
                    application_id = existing_run.application_id
                if not existing_run:
                    if not application_id:
                        raise ValueError("application_id is required when run_id does not exist")
                    db.add(PetitionRun(
                        id=run_id,
                        user_id=user_id,
                        application_id=application_id,
                        criteria_id=criteria_id,
                        status="generating"
                    ))
                    db.flush()

                # Calculate next exhibit number across the WHOLE run
                existing_exhibits = exhibit_repo.get_by_run(user_id, run_id)
                # Use max(exhibit_number) instead of count to avoid collisions when numbers have gaps.
                # Example: existing numbers [1,2,4] -> next must be 5 (not 4).
                max_exhibit_number = max((e.exhibit_number for e in existing_exhibits), default=0)
                start_exhibit_num = max_exhibit_number + 1
                # Calculate section letter based on how many criteria are ALREADY in this run
                # EXCLUDING "personal_info" so the first real criteria starts at 'A'
                existing_criteria = {
                    e.criteria_id for e in existing_exhibits 
                    if e.criteria_id != "personal_info"
                }
                start_section_idx = len(existing_criteria)

            if not application_id:
                raise ValueError("application_id is required for exhibit and exhibit-item inserts")

            # Special handling for Exhibit 1 (Personal Info)
            if criteria_id == "personal_info":
                # If this is the start of a run, it naturally gets 1.
                pass

            # Ensure we don't duplicate Exhibit 1 if personal_info is already there
            # If start_exhibit_num is 1 but personal_info exists in this run, bump it to 2
            # (This shouldn't happen if existing_exhibits includes it, but safety check)
            if start_exhibit_num == 1 and run_id:
                 has_personal_info = exhibit_repo.get_by_run_and_criteria(user_id, run_id, "personal_info")
                 if has_personal_info:
                     start_exhibit_num = 2

            section_letter = string.ascii_uppercase[start_section_idx]
            
            new_exhibits = []
            for i, data in enumerate(exhibit_data):
                title = data['achievement_name'].strip().strip('“”"')
                
                # For personal_info, force section_letter to None or special? 
                current_section_letter = section_letter
                if criteria_id == "personal_info":
                    current_section_letter = None # Exhibit 1 usually stands alone
                
                exhibit = UserExhibit(
                    user_id=user_id,
                    application_id=application_id,
                    run_id=run_id,
                    criteria_id=criteria_id,
                    section_letter=current_section_letter,
                    exhibit_number=start_exhibit_num + i,
                    title=title,
                    summary=data.get("search_query", data['achievement_name'])
                )
                db.add(exhibit)
                db.flush() 
                
                suffixes = list(string.ascii_lowercase)
                seen_ids = set()
                display_titles = {t['doc_id']: t['title'] for t in data.get("translated_titles", [])}
                
                for j, doc_id_str in enumerate(data["doc_ids"]):
                    try:
                        doc_id = uuid.UUID(doc_id_str)
                        if doc_id in seen_ids: continue
                        seen_ids.add(doc_id)
                        
                        content_match = next((c for c in content_entries if c.id == doc_id), None)
                        file_match = next((f for f in files if f.id == doc_id), None)
                        
                        if doc_id_str in display_titles:
                            new_title = display_titles[doc_id_str]
                            if content_match:
                                content_match.title = new_title
                            elif file_match:
                                existing_content = repo.get_evidence_for_file_any(file_match.id)
                                if existing_content:
                                    existing_content.title = new_title
                                    existing_content.criteria = file_match.criteria
                                else:
                                    resolved_app_id = application_id or file_match.application_id
                                    evidence_id = await document_service.process_supabase_document_ocr(
                                        db=db,
                                        user_id=user_id,
                                        document_id=file_match.id,
                                        application_id=resolved_app_id,
                                        force_reextract=False,
                                    )
                                    if evidence_id:
                                        evidence = repo.get_evidence_by_id(evidence_id)
                                        if evidence:
                                            evidence.title = new_title
                                            evidence.criteria = file_match.criteria
                                    else:
                                        db.add(UserEvidenceContent(
                                            user_id=user_id,
                                            application_id=resolved_app_id,
                                            file_id=file_match.id,
                                            title=new_title,
                                            content="",
                                            category=file_match.category,
                                            criteria=file_match.criteria,
                                            type="file"
                                        ))
                        
                        if content_match or file_match:
                            logger.info(
                                "bouncer exhibit item",
                                extra={
                                    "criteria_id": criteria_id,
                                    "exhibit_id": str(exhibit.id),
                                    "doc_id": str(doc_id),
                                    "content_match": bool(content_match),
                                    "file_match": bool(file_match),
                                    "file_id": str(content_match.file_id) if (content_match and content_match.file_id) else (str(file_match.id) if file_match else None),
                                    "content_id": str(content_match.id) if (content_match and not content_match.file_id) else None,
                                },
                            )
                            db.add(UserExhibitItem(
                                application_id=application_id,
                                exhibit_id=exhibit.id,
                                file_id=content_match.file_id if (content_match and content_match.file_id) else (file_match.id if file_match else None),
                                content_id=content_match.id if (content_match and not content_match.file_id) else None,
                                item_suffix=suffixes[len(seen_ids)-1]
                            ))
                    except: continue
                
                new_exhibits.append(exhibit)
            
            try:
                db.commit()
            except Exception as commit_err:
                db.rollback()
                logger.error(f"Failed to persist grouped exhibits: {commit_err}")
                raise
            return new_exhibits
        except Exception as e:
            logger.error(f"Bouncer failed: {e}")
            db.rollback()
            raise

bouncer_agent = BouncerAgent()
