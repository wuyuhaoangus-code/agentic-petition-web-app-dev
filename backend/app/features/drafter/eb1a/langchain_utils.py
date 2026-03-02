from __future__ import annotations

import re


def get_last_name(name: str) -> str:
    return name.split()[-1] if name else "Petitioner"


def format_possessive_name(name: str) -> str:
    if not name:
        return "the Petitioner's"
    return f"{name}'" if name.endswith("s") else f"{name}'s"


def clean_reg_text(text: str) -> str:
    """Remove trailing legal citations for cleaner display."""
    if not text:
        return ""
    if not isinstance(text, str):
        text = str(text) if text is not None else ""
    return re.sub(r"\s*\d+\s+C\.F\.R\.\s+§\s+.*$", "", text).strip()


def normalize_criteria_id(criteria_id: str) -> str:
    if not criteria_id:
        return ""
    key = criteria_id.strip().lower()
    aliases = {
        "press": "published_material",
        "publishedmaterial": "published_material",
        "published materials": "published_material",
        "published_materials": "published_material",
    }
    return aliases.get(key, key)
