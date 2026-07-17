"""Dashboard aggregate Pydantic schemas."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.recommendation import RecommendationItem


class DashboardUserSummary(BaseModel):
    """Minimal user info for the dashboard."""

    github_username: str
    avatar_url: str = ""
    profile_analysis_status: str = "pending"


class DashboardProfileSummary(BaseModel):
    """Profile summary block for the dashboard."""

    experience_level: str = "unknown"
    primary_languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    last_analyzed_at: Optional[datetime] = None


class DashboardRecentActivity(BaseModel):
    """Activity counters for the dashboard."""

    saved_count: int = 0
    blueprints_count: int = 0


class DashboardResponse(BaseModel):
    """Returned by GET /api/dashboard."""

    user: DashboardUserSummary
    profile_summary: Optional[DashboardProfileSummary] = None
    recommendations: list[RecommendationItem] = Field(default_factory=list)
    recent_activity: DashboardRecentActivity = Field(
        default_factory=DashboardRecentActivity
    )
