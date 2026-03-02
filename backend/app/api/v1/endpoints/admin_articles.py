import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from supabase import Client, create_client

from app.core.config import settings
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

admin_router = APIRouter()
public_router = APIRouter()

KV_TABLE = "kv_store_604ca09d"
ARTICLE_KEY_PREFIX = "article:"
SLUG_KEY_PREFIX = "article_slug:"


class ArticlePayload(BaseModel):
    slug: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=500)
    summary: Optional[str] = None
    content: str = Field(min_length=1)
    status: str = Field(default="draft")
    tags: List[str] = Field(default_factory=list)
    author_name: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ArticleUpdatePayload(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    author_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


def _supabase_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def _article_key(article_id: str) -> str:
    return f"{ARTICLE_KEY_PREFIX}{article_id}"


def _slug_key(slug: str) -> str:
    return f"{SLUG_KEY_PREFIX}{slug}"


def _slugify(slug: str) -> str:
    value = (slug or "").strip().lower()
    value = re.sub(r"[^a-z0-9\-_\s]", "", value)
    value = re.sub(r"[\s_]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    if not value:
        raise HTTPException(status_code=400, detail="Invalid slug")
    return value


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _kv_get(client: Client, key: str) -> Optional[Dict[str, Any]]:
    result = client.from_(KV_TABLE).select("key,value").eq("key", key).maybe_single().execute()
    return result.data if result and result.data else None


def _kv_set(client: Client, key: str, value: Dict[str, Any]) -> None:
    res = client.from_(KV_TABLE).upsert({"key": key, "value": value}).execute()
    if res is None:
        raise HTTPException(status_code=500, detail="Failed to write kv data")


def _kv_delete(client: Client, key: str) -> None:
    res = client.from_(KV_TABLE).delete().eq("key", key).execute()
    if res is None:
        raise HTTPException(status_code=500, detail="Failed to delete kv data")


def _list_articles(client: Client) -> List[Dict[str, Any]]:
    # Read all article documents and filter out slug index keys.
    result = client.from_(KV_TABLE).select("key,value").like("key", f"{ARTICLE_KEY_PREFIX}%").execute()
    rows = result.data or []
    articles: List[Dict[str, Any]] = []
    for row in rows:
        key = row.get("key", "")
        if key.startswith(SLUG_KEY_PREFIX):
            continue
        value = row.get("value", {}) or {}
        if isinstance(value, dict):
            articles.append(value)
    return articles


@admin_router.post("", status_code=201)
async def create_article(
    payload: ArticlePayload,
    current_user: Any = Depends(get_current_user),
):
    slug = _slugify(payload.slug)
    client = _supabase_client()

    existing_slug = _kv_get(client, _slug_key(slug))
    if existing_slug:
        raise HTTPException(status_code=409, detail="Slug already exists")

    article_id = str(uuid.uuid4())
    now = _now_iso()
    author_name = payload.author_name or current_user.user_metadata.get("name") or current_user.email
    article = {
        "id": article_id,
        "slug": slug,
        "title": payload.title.strip(),
        "summary": (payload.summary or "").strip(),
        "content": payload.content,
        "status": payload.status.strip().lower(),
        "tags": payload.tags or [],
        "author": {
            "id": str(current_user.id),
            "name": author_name,
        },
        "metadata": payload.metadata or {},
        "created_at": now,
        "updated_at": now,
        "published_at": now if payload.status.strip().lower() == "published" else None,
    }

    _kv_set(client, _article_key(article_id), article)
    _kv_set(client, _slug_key(slug), {"id": article_id})

    return {"status": "success", "article": article}


@admin_router.get("")
async def list_articles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user: Any = Depends(get_current_user),
):
    _ = current_user  # Keep auth dependency explicit.
    client = _supabase_client()
    articles = _list_articles(client)

    if status:
        status_filter = status.strip().lower()
        articles = [a for a in articles if str(a.get("status", "")).lower() == status_filter]

    if search:
        q = search.strip().lower()
        articles = [
            a for a in articles
            if q in str(a.get("title", "")).lower()
            or q in str(a.get("summary", "")).lower()
            or q in str(a.get("content", "")).lower()
        ]

    articles.sort(key=lambda x: x.get("updated_at") or x.get("created_at") or "", reverse=True)
    total = len(articles)
    start = (page - 1) * page_size
    end = start + page_size
    items = articles[start:end]

    return {
        "status": "success",
        "page": page,
        "page_size": page_size,
        "total": total,
        "items": items,
    }


@admin_router.get("/{article_id}")
async def get_article(
    article_id: str,
    current_user: Any = Depends(get_current_user),
):
    _ = current_user
    client = _supabase_client()
    row = _kv_get(client, _article_key(article_id))
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"status": "success", "article": row.get("value", {})}


@admin_router.patch("/{article_id}")
async def update_article(
    article_id: str,
    payload: ArticleUpdatePayload,
    current_user: Any = Depends(get_current_user),
):
    _ = current_user
    client = _supabase_client()
    row = _kv_get(client, _article_key(article_id))
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")

    article = row.get("value", {}) or {}
    old_slug = str(article.get("slug", "")).strip().lower()

    if payload.slug is not None:
        new_slug = _slugify(payload.slug)
        if new_slug != old_slug:
            existing_slug = _kv_get(client, _slug_key(new_slug))
            if existing_slug:
                raise HTTPException(status_code=409, detail="Slug already exists")
            _kv_set(client, _slug_key(new_slug), {"id": article_id})
            if old_slug:
                _kv_delete(client, _slug_key(old_slug))
            article["slug"] = new_slug

    if payload.title is not None:
        article["title"] = payload.title.strip()
    if payload.summary is not None:
        article["summary"] = payload.summary.strip()
    if payload.content is not None:
        article["content"] = payload.content
    if payload.status is not None:
        normalized_status = payload.status.strip().lower()
        article["status"] = normalized_status
        if normalized_status == "published" and not article.get("published_at"):
            article["published_at"] = _now_iso()
    if payload.tags is not None:
        article["tags"] = payload.tags
    if payload.author_name is not None:
        article.setdefault("author", {})
        article["author"]["name"] = payload.author_name
    if payload.metadata is not None:
        article["metadata"] = payload.metadata

    article["updated_at"] = _now_iso()
    _kv_set(client, _article_key(article_id), article)

    return {"status": "success", "article": article}


@admin_router.delete("/{article_id}")
async def delete_article(
    article_id: str,
    current_user: Any = Depends(get_current_user),
):
    _ = current_user
    client = _supabase_client()
    row = _kv_get(client, _article_key(article_id))
    if not row:
        raise HTTPException(status_code=404, detail="Article not found")

    article = row.get("value", {}) or {}
    slug = str(article.get("slug", "")).strip().lower()
    _kv_delete(client, _article_key(article_id))
    if slug:
        _kv_delete(client, _slug_key(slug))
    return {"status": "success"}


@public_router.get("/{slug}")
async def get_public_article_by_slug(slug: str):
    normalized_slug = _slugify(slug)
    client = _supabase_client()
    slug_row = _kv_get(client, _slug_key(normalized_slug))
    if not slug_row:
        raise HTTPException(status_code=404, detail="Article not found")

    article_id = (slug_row.get("value") or {}).get("id")
    if not article_id:
        raise HTTPException(status_code=404, detail="Article not found")

    article_row = _kv_get(client, _article_key(article_id))
    if not article_row:
        raise HTTPException(status_code=404, detail="Article not found")

    article = article_row.get("value", {}) or {}
    if str(article.get("status", "")).lower() != "published":
        raise HTTPException(status_code=404, detail="Article not found")

    return {"status": "success", "article": article}
