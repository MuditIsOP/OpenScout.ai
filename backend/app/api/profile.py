"""Profile API endpoints."""

from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, status, BackgroundTasks

from app.core.auth import get_current_user_id
from app.db.mongodb import get_database
from app.models.profile import ProfileAnalyzeResponse, ProfileResponse
from app.models.user import UserPreferencesRequest, UserPreferencesResponse
from app.services.job_service import create_job
from app.core.exceptions import NotFoundError
from app.workers.tasks import run_profile_analysis

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.post("/analyze", status_code=status.HTTP_202_ACCEPTED, response_model=ProfileAnalyzeResponse)
async def trigger_profile_analysis(
    background_tasks: BackgroundTasks,
    clerk_id: str = Depends(get_current_user_id),
    db = Depends(get_database),
):
    """Trigger background job to analyze user's GitHub profile."""
    # Find user to get github_username
    user = await db["users"].find_one({"clerk_id": clerk_id})
    if not user:
        raise NotFoundError("User not found")
        
    github_username = user.get("github_username", "")
    
    # Generate an idempotency key valid for 1 hour to prevent spamming
    now_hour = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    idempotency_key = f"profile-analysis-{clerk_id}-{now_hour}"
    
    # Update status to queued
    await db["users"].update_one(
        {"clerk_id": clerk_id},
        {"$set": {"profile_analysis_status": "queued", "updated_at": datetime.now(timezone.utc)}}
    )
    
    job_id = await create_job(
        db,
        job_type="profile_analysis",
        payload={"user_id": clerk_id, "github_username": github_username},
        idempotency_key=idempotency_key
    )
    
    # Dispatch task
    background_tasks.add_task(run_profile_analysis, job_id, clerk_id, github_username)
    
    return ProfileAnalyzeResponse(job_id=job_id, status="queued")

@router.get("/me", response_model=ProfileResponse)
async def get_profile(
    clerk_id: str = Depends(get_current_user_id),
    db = Depends(get_database),
):
    """Retrieve the user's inferred profile details."""
    profile = await db["developer_profiles"].find_one({"user_id": clerk_id})
    user = await db["users"].find_one({"clerk_id": clerk_id})
    
    analysis_status = user.get("profile_analysis_status", "pending") if user else "pending"
    
    if not profile:
        return ProfileResponse(profile_analysis_status=analysis_status)
        
    return ProfileResponse(
        experience_level=profile.get("experience_level", "unknown"),
        experience_confidence=profile.get("experience_confidence", 0.0),
        primary_languages=profile.get("primary_languages", []),
        frameworks=profile.get("frameworks", []),
        skills=profile.get("skills", []),
        interests=profile.get("interests", []),
        profile_analysis_status=analysis_status,
        last_analyzed_at=profile.get("last_analyzed_at")
    )

@router.put("/preferences", response_model=UserPreferencesResponse)
async def update_preferences(
    prefs: UserPreferencesRequest,
    clerk_id: str = Depends(get_current_user_id),
    db = Depends(get_database),
):
    """Update onboarding preferences or manual overrides."""
    update_doc = prefs.model_dump(exclude_unset=True)
    update_doc["updated_at"] = datetime.now(timezone.utc)
    
    await db["user_preferences"].update_one(
        {"user_id": clerk_id},
        {"$set": update_doc},
        upsert=True
    )
    
    return UserPreferencesResponse(user_id=clerk_id)
