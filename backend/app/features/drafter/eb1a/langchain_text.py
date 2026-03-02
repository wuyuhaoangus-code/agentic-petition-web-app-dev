from __future__ import annotations

import json
from typing import Any


def coerce_llm_text(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [coerce_llm_text(p).strip() for p in content]
        return "\n\n".join([p for p in parts if p])
    if isinstance(content, dict):
        # Common structured payloads from prompt formats.
        for key in ("text", "content", "conclusion_text", "intro_text"):
            if key in content and content[key]:
                return coerce_llm_text(content[key])
        for key in ("paragraphs", "conclusion_paragraphs", "qualification_paragraphs"):
            if key in content and isinstance(content[key], list):
                parts = [coerce_llm_text(p).strip() for p in content[key]]
                return "\n\n".join([p for p in parts if p])
        return json.dumps(content, ensure_ascii=False)
    return str(content)
