"""Recommendations API endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status, BackgroundTasks

from app.core.auth import get_current_user_id
from app.core.exceptions import PreconditionFailedError
from app.db.mongodb import get_database
from app.models.recommendation import (
    FeedbackRequest,
    FeedbackResponse,
    RecommendationGenerateResponse,
    RecommendationRunResponse,
    RecommendationItem
)
from app.services.job_service import create_job
from app.workers.tasks import run_recommendation_generation

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

@router.post("/generate", status_code=status.HTTP_202_ACCEPTED, response_model=RecommendationGenerateResponse)
async def generate_recommendations(
    background_tasks: BackgroundTasks,
    clerk_id: str = Depends(get_current_user_id),
    db = Depends(get_database),
):
    """Trigger background job to generate recommendations."""
    # Check if profile is complete
    user = await db["users"].find_one({"clerk_id": clerk_id})
    if not user or user.get("profile_analysis_status") != "complete":
        raise PreconditionFailedError("Profile analysis must be complete before generating recommendations.")
        
    now = datetime.now(timezone.utc)
    now_hour = now.strftime("%Y%m%d%H")
    idempotency_key = f"recommendations-{clerk_id}-{now_hour}"
    
    # Create the run record
    run_doc = {
        "user_id": clerk_id,
        "status": "generating",
        "created_at": now,
        "recommendations": []
    }
    result = await db["recommendation_runs"].insert_one(run_doc)
    run_id = str(result.inserted_id)
    
    job_id = await create_job(
        db,
        job_type="recommendation_generation",
        payload={"user_id": clerk_id, "run_id": run_id},
        idempotency_key=idempotency_key
    )
    
    # Dispatch task
    background_tasks.add_task(run_recommendation_generation, job_id, clerk_id, run_id)
    
    return RecommendationGenerateResponse(
        job_id=job_id,
        recommendation_run_id=run_id,
        status="queued"
    )

@router.get("", response_model=RecommendationRunResponse)
async def get_latest_recommendations(
    clerk_id: str = Depends(get_current_user_id),
    db = Depends(get_database),
):
    """Retrieve the latest completed recommendation run for the user."""
    run = await db["recommendation_runs"].find_one(
        {"user_id": clerk_id, "status": "complete"},
        sort=[("created_at", -1)]
    )
    
    if not run:
        # Return empty rather than 404
        return RecommendationRunResponse(run_id="none", recommendations=[])
        
    return RecommendationRunResponse(
        run_id=str(run["_id"]),
        created_at=run.get("created_at"),
        recommendations=[RecommendationItem(**r) for r in run.get("recommendations", [])]
    )

@router.get("/runs/{run_id}", response_model=RecommendationRunResponse)
async def get_specific_recommendations(
    run_id: str,
    clerk_id: str = Depends(get_current_user_id),
    db = Depends(get_database),
):
    """Retrieve recommendations from a specific run."""
    from bson.objectid import ObjectId
    try:
        oid = ObjectId(run_id)
    except Exception:
        raise PreconditionFailedError("Invalid run ID format")
        
    run = await db["recommendation_runs"].find_one({"_id": oid, "user_id": clerk_id})
    if not run:
        # Return empty rather than 404
        return RecommendationRunResponse(run_id=run_id, recommendations=[])
        
    return RecommendationRunResponse(
        run_id=str(run["_id"]),
        created_at=run.get("created_at"),
        recommendations=[RecommendationItem(**r) for r in run.get("recommendations", [])]
    )

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    request: FeedbackRequest,
    clerk_id: str = Depends(get_current_user_id),
    db = Depends(get_database),
):
    """Submit dismiss/save feedback for a recommendation."""
    now = datetime.now(timezone.utc)
    
    if request.signal == "saved":
        await db["user_repository_states"].update_one(
            {"user_id": clerk_id, "repository_id": request.repository_id},
            {"$set": {"is_saved": True, "saved_at": now}},
            upsert=True
        )
    elif request.signal in ("dismissed", "not_interested"):
        await db["user_repository_states"].update_one(
            {"user_id": clerk_id, "repository_id": request.repository_id},
            {"$set": {"is_dismissed": True, "dismissed_at": now}},
            upsert=True
        )
        
    return FeedbackResponse()
