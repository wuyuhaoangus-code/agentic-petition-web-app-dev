from __future__ import annotations

import asyncio
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.features.petitions.repositories import CriteriaDraftRepository, PetitionRunRepository
from app.features.documents.models import UserCriteriaDraft


async def get_legal_precedents(
    embeddings,
    supabase,
    rag_locks: dict,
    criteria_id: str,
    field: str,
    occupation: str,
    query_text: str | None = None,
    user_id: uuid.UUID | None = None,
    db: Session | None = None,
    force_refresh: bool = False,
    run_id: uuid.UUID | None = None,
) -> str:
    """
    Retrieves relevant AAO legal precedents.
    Uses a lock and DB cache to prevent redundant or parallel queries.
    """
    lock_key = f"{user_id}_{criteria_id}"
    if lock_key not in rag_locks:
        rag_locks[lock_key] = asyncio.Lock()

    async with rag_locks[lock_key]:
        if not force_refresh and db and user_id:
            criteria_repo = CriteriaDraftRepository(db)
            cached = criteria_repo.get_latest_for_user_criteria(user_id, criteria_id)

            if cached and cached.precedent_context:
                if cached.rag_field == field and cached.rag_occupation == occupation:
                    print(f"DEBUG RAG: Using PERSISTENT cache for {criteria_id} (Matches {field})")
                    return cached.precedent_context
                else:
                    print(f"DEBUG RAG: Cache found but field/occupation changed. Refreshing...")

        print(f"DEBUG RAG: {'Force refresh' if force_refresh else 'Starting fresh retrieval'} for {criteria_id}")
        try:
            if query_text:
                semantic_query = (
                    f"AAO legal logic and denial reasons for {criteria_id} "
                    f"in the field of {field} as {occupation}. "
                    f"Focus on: {query_text}"
                )
            else:
                semantic_query = (
                    f"AAO legal logic and denial reasons for {criteria_id} "
                    f"in the field of {field} as {occupation}"
                )

            print(f"DEBUG RAG: Generating embedding for query: {semantic_query[:150]}...")
            raw_embedding = await embeddings.aembed_query(semantic_query)

            import numpy as np
            query_embedding = (raw_embedding / np.linalg.norm(raw_embedding)).tolist()

            response = supabase.rpc("match_aao_precedents_eb1a", {
                "query_embedding": query_embedding,
                "match_threshold": 0.6,
                "match_count": 10,
                "filter_criteria_id": criteria_id,
                "filter_field": None
            }).execute()

            if not response.data:
                return "No specific case law found; rely on standard regulatory criteria."

            sorted_cases = sorted(
                response.data,
                key=lambda x: (str(x.get("metadata", {}).get("outcome", "")).lower() == "dismissed", x.get("similarity", 0)),
                reverse=True
            )

            unique_cases = []
            seen_sources = set()
            for case in sorted_cases:
                source = case.get("metadata", {}).get("source", "Unknown")
                if source not in seen_sources:
                    unique_cases.append(case)
                    seen_sources.add(source)
                if len(unique_cases) >= 3:
                    break

            precedent_blocks = []
            for case in unique_cases:
                meta = case.get("metadata", {})
                block = (
                    f"SOURCE: {meta.get('source', 'Unknown Case')}\n"
                    f"OUTCOME: {meta.get('outcome', 'unknown')}\n"
                    f"DENIAL REASON: {meta.get('denial_reason', 'N/A')}\n"
                    f"LEGAL ANALYSIS: {str(case.get('content', ''))[:2000]}..."
                )
                precedent_blocks.append(block)

            result = "\n\n---\n\n".join(precedent_blocks)

            if db and user_id:
                criteria_repo = CriteriaDraftRepository(db)
                draft = criteria_repo.get_latest_for_user_criteria(user_id, criteria_id)

                if not draft and run_id:
                    run_repo = PetitionRunRepository(db)
                    run_rec = run_repo.get_by_id(run_id, user_id)
                    if not run_rec or not run_rec.application_id:
                        raise ValueError("Cannot cache precedents without petition_runs.application_id")
                    draft = UserCriteriaDraft(
                        run_id=run_id,
                        user_id=user_id,
                        application_id=run_rec.application_id,
                        criteria_id=criteria_id
                    )
                    db.add(draft)

                if draft:
                    draft.precedent_context = result
                    draft.rag_field = field
                    draft.rag_occupation = occupation
                    try:
                        db.commit()
                    except Exception as commit_err:
                        db.rollback()
                        print(f"DEBUG RAG ERROR: failed to persist cache: {commit_err}")
                    print(f"DEBUG RAG: Saved precedents to DB cache for {criteria_id} (Field: {field})")

            return result
        except Exception as e:
            print(f"DEBUG RAG ERROR: {str(e)}")
            return "No specific case law found; rely on standard regulatory criteria."


class RAGFetcher:
    def __init__(self, embeddings, supabase, rag_locks: dict):
        self.embeddings = embeddings
        self.supabase = supabase
        self.rag_locks = rag_locks

    async def get(
        self,
        criteria_id: str,
        field: str,
        occupation: str,
        query_text: str,
        user_id: uuid.UUID | None = None,
        db: Session | None = None,
        force_refresh: bool = False,
        run_id: uuid.UUID | None = None,
    ) -> str:
        return await get_legal_precedents(
            embeddings=self.embeddings,
            supabase=self.supabase,
            rag_locks=self.rag_locks,
            criteria_id=criteria_id,
            field=field,
            occupation=occupation,
            query_text=query_text,
            user_id=user_id,
            db=db,
            force_refresh=force_refresh,
            run_id=run_id,
        )
