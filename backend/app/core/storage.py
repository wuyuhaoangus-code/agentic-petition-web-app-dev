from __future__ import annotations

from typing import Protocol
from supabase import create_client, Client

from app.core.config import settings


class StorageGateway(Protocol):
    def upload(self, path: str, content: bytes, content_type: str) -> None:
        ...

    def download(self, path: str) -> bytes:
        ...

    def delete(self, path: str) -> None:
        ...


class SupabaseStorageGateway:
    def __init__(self, client: Client | None = None, bucket: str | None = None):
        self._client = client
        self._bucket = bucket or settings.SUPABASE_STORAGE_BUCKET

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        return self._client

    def upload(self, path: str, content: bytes, content_type: str) -> None:
        self.client.storage.from_(self._bucket).upload(
            path=path,
            file=content,
            file_options={"content-type": content_type, "upsert": "true"},
        )

    def download(self, path: str) -> bytes:
        payload = self.client.storage.from_(self._bucket).download(path)
        if isinstance(payload, (bytes, bytearray)):
            return bytes(payload)
        data = getattr(payload, "data", b"")
        return bytes(data) if isinstance(data, (bytes, bytearray)) else b""

    def delete(self, path: str) -> None:
        self.client.storage.from_(self._bucket).remove([path])


def get_supabase_storage_gateway() -> SupabaseStorageGateway:
    return SupabaseStorageGateway()
