from __future__ import annotations

import logging
import os
from typing import Any, Dict

import yaml

logger = logging.getLogger(__name__)


def load_prompt_registry() -> Dict[str, Dict[str, Any]]:
    """Loads all YAML prompts from the prompts directory."""
    registry: Dict[str, Dict[str, Any]] = {}
    # Use absolute path relative to this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Go up from eb1a/ to drafter/ and then into prompts/
    prompt_dir = os.path.join(os.path.dirname(current_dir), "prompts")

    if not os.path.exists(prompt_dir):
        logger.warning(f"Prompt directory not found at {prompt_dir}")
        return {}

    for filename in os.listdir(prompt_dir):
        if filename.endswith(".yaml"):
            file_path = os.path.join(prompt_dir, filename)
            try:
                with open(file_path, "r") as f:
                    data = yaml.safe_load(f)
                    if data and "criteria_id" in data:
                        registry[data["criteria_id"]] = data
                        logger.info(f"Loaded prompt registry for: {data['criteria_id']}")
            except Exception as e:
                logger.error(f"Failed to load prompt file {filename}: {e}")

    # Backward/forward compatibility for renamed criteria IDs.
    # Frontend now uses "published_material" while legacy prompts used "press".
    if "published_material" not in registry and "press" in registry:
        registry["published_material"] = registry["press"]
    if "press" not in registry and "published_material" in registry:
        registry["press"] = registry["published_material"]

    return registry


PROMPT_REGISTRY = load_prompt_registry()
