from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class DraftedSection(BaseModel):
    """Schema for a drafted exhibit section."""
    paragraphs: List[str] = Field(description="The formal legal paragraphs for the exhibit. Usually 2-3.")
    grounding_citations: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Optional web citations found during research. Each dict should have 'title' and 'url'.",
    )


class SectionIntro(BaseModel):
    """Schema for a section introduction."""
    intro_text: str = Field(description="The formal introductory paragraph for the section.")


class SectionConclusion(BaseModel):
    """Schema for a section conclusion."""
    conclusion_text: str = Field(description="The formal synthesizing conclusion for the section.")


class PetitionIntro(BaseModel):
    """Schema for the petition introduction section."""
    opening_paragraph: str = Field(description="Opening paragraph before the qualification heading.")
    qualification_paragraphs: List[str] = Field(
        description="Paragraphs under the qualification heading (3-5)."
    )


class PetitionConclusion(BaseModel):
    """Schema for the petition conclusion section."""
    heading: str = Field(description='Use exactly "CONCLUSION".')
    conclusion_paragraphs: List[str] = Field(
        description="A concise set of formal closing paragraphs (3-5)."
    )
