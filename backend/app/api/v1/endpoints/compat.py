import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from supabase import Client, create_client

from app.core.config import settings
from app.core.security import get_current_user
from app.db.session import get_db
from app.features.users.service import profile_service

logger = logging.getLogger(__name__)

router = APIRouter()

KV_TABLE = "kv_store_604ca09d"
POST_KEY_PREFIX = "post:"
POST_SLUG_PREFIX = "post_slug:"

security = HTTPBearer(auto_error=False)


def _supabase_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify(value: str) -> str:
    slug = (value or "").strip().lower()
    slug = re.sub(r"[^a-z0-9\-_\s]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    if not slug:
        raise HTTPException(status_code=400, detail="Invalid slug")
    return slug


def _post_key(post_id: str) -> str:
    return f"{POST_KEY_PREFIX}{post_id}"


def _post_slug_key(slug: str) -> str:
    return f"{POST_SLUG_PREFIX}{slug}"


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


def _list_posts(client: Client) -> List[Dict[str, Any]]:
    result = client.from_(KV_TABLE).select("key,value").like("key", f"{POST_KEY_PREFIX}%").execute()
    rows = result.data or []
    posts: List[Dict[str, Any]] = []
    for row in rows:
        key = row.get("key", "")
        if key.startswith(POST_SLUG_PREFIX):
            continue
        value = row.get("value", {}) or {}
        if isinstance(value, dict):
            posts.append(value)
    return posts


async def _require_anon_or_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing auth token")

    token = credentials.credentials
    if token == settings.SUPABASE_ANON_KEY:
        return None

    return await get_current_user(credentials)


class PostPayload(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    status: Optional[str] = Field(default="draft")
    author: Optional[str] = None
    categories: List[str] = Field(default_factory=list)
    views: Optional[int] = 0
    publishedAt: Optional[str] = None
    scheduledFor: Optional[str] = None
    updatedAt: Optional[str] = None
    createdAt: Optional[str] = None
    imageUrl: Optional[str] = None
    imageAlt: Optional[str] = None
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None


@router.get("/health")
async def compat_health():
    return {"status": "healthy"}


@router.get("/env-check")
async def env_check():
    configured = {
        "SUPABASE_URL": bool(settings.SUPABASE_URL),
        "SUPABASE_ANON_KEY": bool(settings.SUPABASE_ANON_KEY),
        "SUPABASE_SERVICE_ROLE_KEY": bool(settings.SUPABASE_SERVICE_ROLE_KEY),
    }
    all_configured = all(configured.values())
    message = "All required environment variables are configured." if all_configured else "Missing required environment variables."
    return {
        "allConfigured": all_configured,
        "configured": configured,
        "message": message,
    }


@router.get("/profile")
async def compat_get_profile(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
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
        "occupation": profile.occupation,
    }


@router.post("/profile")
async def compat_update_profile(
    data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user),
):
    user_id = uuid.UUID(current_user.id)
    profile = profile_service.update_profile(db, user_id, data)
    return {
        "id": str(profile.id),
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "full_name": profile.full_name,
        "field": profile.field,
        "occupation": profile.occupation,
    }


@router.get("/posts")
async def get_posts(_: Any = Depends(_require_anon_or_user)):
    client = _supabase_client()
    posts = _list_posts(client)
    posts.sort(key=lambda x: x.get("updatedAt") or x.get("createdAt") or "", reverse=True)
    return posts


@router.get("/posts/{post_id}")
async def get_post(post_id: str, _: Any = Depends(_require_anon_or_user)):
    client = _supabase_client()
    row = _kv_get(client, _post_key(post_id))
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    return row.get("value", {})


@router.post("/posts")
async def create_post(
    payload: PostPayload,
    current_user: Any = Depends(_require_anon_or_user),
):
    client = _supabase_client()

    title = (payload.title or "Untitled").strip() or "Untitled"
    slug_source = payload.slug or title
    slug = _slugify(slug_source)

    existing_slug = _kv_get(client, _post_slug_key(slug))
    if existing_slug:
        raise HTTPException(status_code=409, detail="Slug already exists")

    now = _now_iso()
    author_name = payload.author
    if not author_name and current_user is not None:
        author_name = current_user.user_metadata.get("name") or current_user.email
    author_name = author_name or "DreamCard"

    post_id = str(uuid.uuid4())
    status = (payload.status or "draft").lower()
    published_at = payload.publishedAt
    if status == "published" and not published_at:
        published_at = now

    post = {
        "id": post_id,
        "title": title,
        "slug": slug,
        "content": payload.content or "",
        "excerpt": payload.excerpt or "",
        "status": status,
        "author": author_name,
        "categories": payload.categories or [],
        "views": payload.views or 0,
        "publishedAt": published_at,
        "scheduledFor": payload.scheduledFor,
        "updatedAt": now,
        "createdAt": payload.createdAt or now,
        "imageUrl": payload.imageUrl,
        "imageAlt": payload.imageAlt,
        "metaTitle": payload.metaTitle,
        "metaDescription": payload.metaDescription,
    }

    _kv_set(client, _post_key(post_id), post)
    _kv_set(client, _post_slug_key(slug), {"id": post_id})

    return post


@router.put("/posts/{post_id}")
async def update_post(
    post_id: str,
    payload: PostPayload,
    current_user: Any = Depends(_require_anon_or_user),
):
    client = _supabase_client()
    row = _kv_get(client, _post_key(post_id))
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")

    post = row.get("value", {}) or {}
    old_slug = str(post.get("slug", "")).strip().lower()

    if payload.slug is not None or payload.title is not None:
        slug_source = payload.slug or payload.title or old_slug
        new_slug = _slugify(slug_source)
        if new_slug != old_slug:
            existing_slug = _kv_get(client, _post_slug_key(new_slug))
            if existing_slug:
                raise HTTPException(status_code=409, detail="Slug already exists")
            _kv_set(client, _post_slug_key(new_slug), {"id": post_id})
            if old_slug:
                _kv_delete(client, _post_slug_key(old_slug))
            post["slug"] = new_slug

    if payload.title is not None:
        post["title"] = payload.title.strip() or post.get("title")
    if payload.content is not None:
        post["content"] = payload.content
    if payload.excerpt is not None:
        post["excerpt"] = payload.excerpt
    if payload.status is not None:
        normalized_status = payload.status.strip().lower()
        post["status"] = normalized_status
        if normalized_status == "published" and not post.get("publishedAt"):
            post["publishedAt"] = _now_iso()
    if payload.author is not None:
        post["author"] = payload.author
    elif current_user is not None and not post.get("author"):
        post["author"] = current_user.user_metadata.get("name") or current_user.email
    if payload.categories is not None:
        post["categories"] = payload.categories
    if payload.views is not None:
        post["views"] = payload.views
    if payload.publishedAt is not None:
        post["publishedAt"] = payload.publishedAt
    if payload.scheduledFor is not None:
        post["scheduledFor"] = payload.scheduledFor
    if payload.imageUrl is not None:
        post["imageUrl"] = payload.imageUrl
    if payload.imageAlt is not None:
        post["imageAlt"] = payload.imageAlt
    if payload.metaTitle is not None:
        post["metaTitle"] = payload.metaTitle
    if payload.metaDescription is not None:
        post["metaDescription"] = payload.metaDescription

    post["updatedAt"] = _now_iso()

    _kv_set(client, _post_key(post_id), post)

    return post


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, _: Any = Depends(_require_anon_or_user)):
    client = _supabase_client()
    row = _kv_get(client, _post_key(post_id))
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")

    post = row.get("value", {}) or {}
    slug = str(post.get("slug", "")).strip().lower()
    _kv_delete(client, _post_key(post_id))
    if slug:
        _kv_delete(client, _post_slug_key(slug))
    return {"status": "success"}


@router.post("/posts/seed")
async def seed_posts(_: Any = Depends(_require_anon_or_user)):
    client = _supabase_client()
    existing = _list_posts(client)
    if existing:
        return {"status": "skipped", "count": len(existing)}

    now = _now_iso()
    seed_data = [
        {
            "title": "Building an EB-1A Petition Strategy",
            "slug": "eb1a-petition-strategy",
            "content": "Drafting a strong EB-1A petition starts with evidence strategy and clear narrative flow.",
            "excerpt": "Drafting a strong EB-1A petition starts with evidence strategy and clear narrative flow.",
            "status": "published",
            "author": "DreamCard",
            "categories": ["eb1a", "strategy"],
            "views": 0,
            "publishedAt": now,
            "scheduledFor": None,
            "updatedAt": now,
            "createdAt": now,
            "imageUrl": None,
            "imageAlt": None,
            "metaTitle": "EB-1A Petition Strategy",
            "metaDescription": "How to build an EB-1A petition narrative with strong evidence.",
        },
        {
            "title": "Evidence Mapping Checklist",
            "slug": "evidence-mapping-checklist",
            "content": "Map each evidence item to criteria early to avoid gaps later in drafting.",
            "excerpt": "Map each evidence item to criteria early to avoid gaps later in drafting.",
            "status": "draft",
            "author": "DreamCard",
            "categories": ["eb1a", "evidence"],
            "views": 0,
            "publishedAt": None,
            "scheduledFor": None,
            "updatedAt": now,
            "createdAt": now,
            "imageUrl": None,
            "imageAlt": None,
            "metaTitle": "Evidence Mapping Checklist",
            "metaDescription": "A checklist for mapping evidence to EB-1A criteria.",
        },
    ]

    for entry in seed_data:
        post_id = str(uuid.uuid4())
        _kv_set(client, _post_key(post_id), {"id": post_id, **entry})
        _kv_set(client, _post_slug_key(entry["slug"]), {"id": post_id})

    return {"status": "seeded", "count": len(seed_data)}
