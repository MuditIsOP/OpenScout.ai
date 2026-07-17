"""Candidate ingestion service."""

from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.github_service import github_service
from app.services.eligibility_filter import check_eligibility

async def ingest_candidates(db: AsyncIOMotorDatabase, profile: dict) -> list[dict]:
    """Build queries based on profile, fetch from GitHub, deduplicate and save to DB."""
    languages = profile.get("primary_languages", [])[:3]
    frameworks = profile.get("frameworks", [])[:3]
    interests = profile.get("interests", [])[:2]

    # Build query
    query_parts = []
    if languages:
        query_parts.append(f"language:{languages[0]}")
    for fw in frameworks:
        query_parts.append(fw)
    for topic in interests:
        query_parts.append(f"topic:{topic}")
        
    query_str = " ".join(query_parts) if query_parts else "good first issue"
    # Ensure we get recent repos
    # query_str += " pushed:>2023-01-01"

    # Fetch candidates
    raw_candidates = await github_service.search_repositories(query_str, limit=30)
    
    # Process and save
    processed = []
    now = datetime.now(timezone.utc)
    
    for repo in raw_candidates:
        github_repo_id = repo.get("id")
        if not github_repo_id:
            continue
            
        is_eligible, reasons = check_eligibility(repo)
        
        doc = {
            "github_repo_id": github_repo_id,
            "full_name": repo.get("full_name"),
            "description": repo.get("description", ""),
            "primary_language": repo.get("language", ""),
            "topics": repo.get("topics", []),
            "stars": repo.get("stargazers_count", 0),
            "forks": repo.get("forks_count", 0),
            "open_issues_count": repo.get("open_issues_count", 0),
            "last_commit_at": repo.get("pushed_at"),
            "license": repo.get("license", {}).get("key") if repo.get("license") else None,
            "is_fork": repo.get("fork", False),
            "is_archived": repo.get("archived", False),
            "eligibility_status": "eligible" if is_eligible else "ineligible",
            "eligibility_reasons": reasons,
            "updated_at": now,
        }
        
        # Deduplicate and upsert
        await db["repositories"].update_one(
            {"github_repo_id": github_repo_id},
            {"$set": doc},
            upsert=True
        )
        
        # Fetch the complete doc with Mongo ID
        saved_doc = await db["repositories"].find_one({"github_repo_id": github_repo_id})
        if saved_doc and is_eligible:
            processed.append(saved_doc)
            
    return processed
