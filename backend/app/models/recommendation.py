"""Recommendation-related Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    """A single recommendation inside a run."""

    repository_id: str
    full_name: str
    description: str = ""
    primary_language: str = ""
    stars: int = 0
    match_score: float = 0.0
    confidence_score: float = 0.0
    reasons: list[str] = Field(default_factory=list)
    difficulty_badge: str = ""


class RecommendationRunResponse(BaseModel):
    """Returned by GET /api/recommendations and GET /api/recommendations/runs/:run_id."""

    run_id: str
    created_at: Optional[datetime] = None
    recommendations: list[RecommendationItem] = Field(default_factory=list)


class RecommendationGenerateResponse(BaseModel):
    """Returned by POST /api/recommendations/generate (202 Accepted)."""

    job_id: str
    recommendation_run_id: str
    status: str = "queued"


class FeedbackRequest(BaseModel):
    """Request body for POST /api/recommendations/feedback."""

    repository_id: str
    signal: str = Field(..., pattern="^(dismissed|saved|not_interested)$")


class FeedbackResponse(BaseModel):
    """Response for POST /api/recommendations/feedback."""

    message: str = "Feedback recorded"
