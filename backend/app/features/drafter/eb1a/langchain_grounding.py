from __future__ import annotations

import logging
from typing import Any


logger = logging.getLogger(__name__)


def resolve_organic_url(url: str) -> str:
    try:
        from urllib.parse import unquote, urlparse, parse_qs
        decoded = unquote(url)
        parsed = urlparse(decoded)
        params = parse_qs(parsed.query)
        for key in ["url", "q", "u", "link"]:
            if key in params and params[key]:
                candidate = params[key][0]
                if candidate.startswith("http"):
                    return candidate
        if "vertexaisearch.cloud.google.com" in url:
            import requests
            resp = requests.head(url, allow_redirects=True, timeout=3)
            return resp.url
    except Exception:
        pass
    return url


def apply_grounding(text: str, response: Any) -> str:
    """Apply grounding markers from LLM metadata if present."""
    if not response or not hasattr(response, "response_metadata"):
        return text

    metadata_dict = getattr(response, "response_metadata", {})
    metadata = metadata_dict.get("prompt_feedback", {}).get("grounding_metadata") or \
        metadata_dict.get("grounding_metadata")

    if not metadata:
        return text

    supports = metadata.get("grounding_supports") or metadata.get("groundingSupports") or []
    if not supports:
        return text

    # Map source index to earliest end_index
    first_mentions = {}
    for support in supports:
        indices = support.get("grounding_chunk_indices") or support.get("groundingChunkIndices") or []
        segment = support.get("segment") or {}
        end = segment.get("end_index") or segment.get("endIndex")
        if end is not None and indices:
            idx = indices[0] + 1
            if idx <= 4:
                if idx not in first_mentions or end < first_mentions[idx]:
                    first_mentions[idx] = end

    sorted_citations = sorted(first_mentions.items(), key=lambda x: x[1], reverse=True)
    modified_text = text
    for idx, end in sorted_citations:
        modified_text = modified_text[:end] + f" [{idx}]" + modified_text[end:]
    return modified_text
