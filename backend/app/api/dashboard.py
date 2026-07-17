"""Dashboard aggregate API endpoint."""

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user_id
from app.db.mongodb import get_database
from app.models.dashboard import (
    DashboardResponse,
    DashboardUserSummary,
    DashboardProfileSummary,
    DashboardRecentActivity
)
from app.models.recommendation import RecommendationItem

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    clerk_id: str = Depends(get_current_user_id),
    db = Depends(get_database),
):
    """Aggregate user, profile, recommendations, and activity for the dashboard view."""
    
    # 1. User Summary
    user = await db["users"].find_one({"clerk_id": clerk_id})
    user_summary = DashboardUserSummary(
        github_username=user.get("github_username", "") if user else "",
        avatar_url=user.get("avatar_url", "") if user else "",
        profile_analysis_status=user.get("profile_analysis_status", "pending") if user else "pending"
    )
    
    # 2. Profile Summary
    profile = await db["developer_profiles"].find_one({"user_id": clerk_id})
    profile_summary = None
    if profile:
        profile_summary = DashboardProfileSummary(
            experience_level=profile.get("experience_level", "unknown"),
            primary_languages=profile.get("primary_languages", []),
            frameworks=profile.get("frameworks", []),
            skills=profile.get("skills", []),
            last_analyzed_at=profile.get("last_analyzed_at")
        )
        
    # 3. Latest Recommendations
    run = await db["recommendation_runs"].find_one(
        {"user_id": clerk_id, "status": "complete"},
        sort=[("created_at", -1)]
    )
    recommendations = []
    if run:
        recommendations = [RecommendationItem(**r) for r in run.get("recommendations", [])]
        
    # 4. Recent Activity
    saved_count = await db["user_repository_states"].count_documents({
        "user_id": clerk_id,
        "is_saved": True
    })
    
    activity = DashboardRecentActivity(
        saved_count=saved_count,
        blueprints_count=0 # Placeholder for phase 2
    )
    
    return DashboardResponse(
        user=user_summary,
        profile_summary=profile_summary,
        recommendations=recommendations,
        recent_activity=activity
    )
