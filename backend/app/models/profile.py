"""Profile-related Pydantic response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    """Returned by GET /api/profile/me."""

    experience_level: str = "unknown"
    experience_confidence: float = 0.0
    primary_languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    profile_analysis_status: str = "pending"
    last_analyzed_at: Optional[datetime] = None


class ProfileAnalyzeResponse(BaseModel):
    """Returned by POST /api/profile/analyze (202 Accepted)."""

    job_id: str
    status: str = "queued"
