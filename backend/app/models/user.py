"""User-related Pydantic request/response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    """Returned by GET /api/auth/me."""

    user_id: str
    clerk_id: str
    github_username: str
    avatar_url: str = ""
    profile_analysis_status: str = "pending"
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None


class UserPreferencesRequest(BaseModel):
    """Request body for PUT /api/profile/preferences."""

    skills: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    frameworks: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)
    contribution_preferences: list[str] = Field(default_factory=list)
    difficulty_preference: str = Field(
        "beginner",
        pattern="^(beginner|intermediate|advanced)$",
    )
    jules_api_key: Optional[str] = None


class UserPreferencesResponse(BaseModel):
    """Response for PUT /api/profile/preferences."""

    message: str = "Preferences saved successfully"
    user_id: str
