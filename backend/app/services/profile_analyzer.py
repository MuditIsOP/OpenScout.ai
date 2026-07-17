"""Developer Profile Analyzer Service."""

from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.github_service import github_service

async def analyze_profile(db: AsyncIOMotorDatabase, clerk_id: str, github_username: str) -> None:
    """Analyze a developer's GitHub profile and upsert into database."""
    now = datetime.now(timezone.utc)
    
    # 1. Fallback for no github username
    if not github_username:
        # Check for user_preferences
        prefs = await db["user_preferences"].find_one({"user_id": clerk_id})
        if prefs:
            profile = {
                "user_id": clerk_id,
                "experience_level": prefs.get("difficulty_preference", "beginner"),
                "experience_confidence": 0.5,
                "primary_languages": prefs.get("languages", []),
                "frameworks": prefs.get("frameworks", []),
                "skills": prefs.get("skills", []),
                "interests": prefs.get("interests", []),
                "last_analyzed_at": now,
            }
        else:
            profile = {
                "user_id": clerk_id,
                "experience_level": "unknown",
                "experience_confidence": 0.0,
                "primary_languages": [],
                "frameworks": [],
                "skills": [],
                "interests": [],
                "last_analyzed_at": now,
            }
            
        await db["developer_profiles"].update_one(
            {"user_id": clerk_id},
            {"$set": profile},
            upsert=True
        )
        return

    # 2. Fetch repos from GitHub
    repos = await github_service.get_user_repos(github_username)
    
    # If no public repos, fallback to preferences
    if not repos:
        prefs = await db["user_preferences"].find_one({"user_id": clerk_id})
        languages = prefs.get("languages", []) if prefs else []
        frameworks = prefs.get("frameworks", []) if prefs else []
        skills = prefs.get("skills", []) if prefs else []
        interests = prefs.get("interests", []) if prefs else []
        experience = prefs.get("difficulty_preference", "beginner") if prefs else "beginner"
        confidence = 0.5 if prefs else 0.0
    else:
        # 3. Deterministic parsing
        lang_bytes: dict[str, int] = {}
        topics_count: dict[str, int] = {}
        total_commits = 0  # In a full implementation, we'd query commits
        
        for repo in repos:
            # Languages
            repo_langs = await github_service.get_repo_languages(repo["full_name"])
            for lang, count in repo_langs.items():
                lang_bytes[lang] = lang_bytes.get(lang, 0) + count
                
            # Topics
            for topic in repo.get("topics", []):
                topics_count[topic] = topics_count.get(topic, 0) + 1
                
        # Top 5 languages
        sorted_langs = sorted(lang_bytes.items(), key=lambda x: x[1], reverse=True)
        primary_languages = [lang for lang, _ in sorted_langs[:5]]
        
        # Frameworks & Skills (simplified inference from topics)
        sorted_topics = sorted(topics_count.items(), key=lambda x: x[1], reverse=True)
        top_topics = [topic for topic, _ in sorted_topics[:10]]
        
        frameworks = [t for t in top_topics if t in ("react", "vue", "angular", "fastapi", "django", "flask", "nextjs", "express")]
        interests = [t for t in top_topics if t not in frameworks]
        skills = ["Git", "Open Source"] # Baseline
        
        # Experience heuristics
        total_repos = len(repos)
        if total_repos > 15:
            experience = "advanced"
            confidence = 0.8
        elif total_repos > 5:
            experience = "intermediate"
            confidence = 0.7
        else:
            experience = "beginner"
            confidence = 0.9

    profile = {
        "user_id": clerk_id,
        "experience_level": experience,
        "experience_confidence": confidence,
        "primary_languages": primary_languages,
        "frameworks": frameworks,
        "skills": skills,
        "interests": interests,
        "last_analyzed_at": now,
    }
    
    # 4. Save to database
    await db["developer_profiles"].update_one(
        {"user_id": clerk_id},
        {"$set": profile},
        upsert=True
    )
    
    # Snapshot (audit trail)
    profile["snapshot_at"] = now
    await db["profile_snapshots"].insert_one(profile)
