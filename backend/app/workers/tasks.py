"""Background task dispatchers.

These tasks simulate asynchronous job processing (e.g., using Celery or ARQ).
In this MVP, they might be triggered via FastAPI's BackgroundTasks, but 
they update their status in the MongoDB background_jobs collection durably.
"""

import asyncio
from datetime import datetime, timezone
from bson.objectid import ObjectId

from app.db.mongodb import get_database
from app.services.job_service import update_job_status
from app.services.profile_analyzer import analyze_profile
from app.services.candidate_service import ingest_candidates
from app.services.recommendation_engine import calculate_match_score
from app.services.ai_service import ai_service

async def run_profile_analysis(job_id: str, user_id: str, github_username: str) -> None:
    """Execute profile analysis job."""
    db = get_database()
    try:
        await update_job_status(db, job_id, "running")
        
        # Analyze profile
        await analyze_profile(db, user_id, github_username)
        
        # Mark user profile as complete
        await db["users"].update_one(
            {"clerk_id": user_id},
            {"$set": {"profile_analysis_status": "complete", "updated_at": datetime.now(timezone.utc)}}
        )
        
        await update_job_status(db, job_id, "completed")
    except Exception as e:
        print(f"Profile analysis job failed: {e}")
        await update_job_status(db, job_id, "failed", error=str(e))
        await db["users"].update_one(
            {"clerk_id": user_id},
            {"$set": {"profile_analysis_status": "failed"}}
        )

async def run_recommendation_generation(job_id: str, user_id: str, run_id: str) -> None:
    """Execute recommendation generation job."""
    db = get_database()
    try:
        await update_job_status(db, job_id, "running")
        
        # 1. Fetch user profile
        profile = await db["developer_profiles"].find_one({"user_id": user_id})
        if not profile:
            raise ValueError("Profile not found")
            
        # 2. Ingest candidates
        candidates = await ingest_candidates(db, profile)
        
        # 3. Heuristic Scoring
        scored_candidates = []
        for repo in candidates:
            score_data = calculate_match_score(profile, repo)
            scored_candidates.append({
                "repo": repo,
                "score_data": score_data
            })
            
        # Sort by total_score descending
        scored_candidates.sort(key=lambda x: x["score_data"]["total_score"], reverse=True)
        
        # Take top 10
        top_candidates = scored_candidates[:10]
        
        # 4. AI Explanations
        final_recommendations = []
        for item in top_candidates:
            repo = item["repo"]
            score_data = item["score_data"]
            
            ai_explanation = await ai_service.generate_recommendation_explanations(
                db, profile, repo, score_data["breakdown"]
            )
            
            difficulty = "beginner-friendly" if profile.get("experience_level") == "beginner" else "moderate"
            
            rec_item = {
                "repository_id": str(repo["_id"]) if "_id" in repo else repo.get("github_repo_id"),
                "full_name": repo.get("full_name"),
                "description": repo.get("description", ""),
                "primary_language": repo.get("primary_language", ""),
                "stars": repo.get("stars", 0),
                "match_score": score_data["total_score"],
                "confidence_score": ai_explanation.get("confidence_score", 0.8),
                "reasons": ai_explanation.get("reasons", []),
                "difficulty_badge": difficulty
            }
            final_recommendations.append(rec_item)
            
        # 5. Save results to run doc
        await db["recommendation_runs"].update_one(
            {"_id": ObjectId(run_id)},
            {
                "$set": {
                    "status": "complete",
                    "recommendations": final_recommendations,
                    "updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        await update_job_status(db, job_id, "completed")
    except Exception as e:
        print(f"Recommendation generation job failed: {e}")
        await update_job_status(db, job_id, "failed", error=str(e))
        await db["recommendation_runs"].update_one(
            {"_id": ObjectId(run_id)},
            {"$set": {"status": "failed", "error": str(e)}}
        )
