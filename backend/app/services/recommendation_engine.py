"""Heuristic scoring engine for recommendations."""

def calculate_match_score(profile: dict, repo: dict) -> dict:
    """Calculate composite match score based on deterministic weighted formula."""
    
    score_breakdown = {
        "language_match": 0.0,
        "framework_match": 0.0,
        "difficulty_match": 0.0,
        "recency_match": 0.0,
        "beginner_match": 0.0,
        "health_match": 0.0,
    }
    
    # 1. 30% Language Overlap
    repo_lang = repo.get("primary_language", "").lower()
    profile_langs = [l.lower() for l in profile.get("primary_languages", [])]
    if repo_lang and repo_lang in profile_langs:
        score_breakdown["language_match"] = 1.0
    elif profile_langs:
        # Partial match if primary language isn't the main one but might be in stack (simplified)
        score_breakdown["language_match"] = 0.5
        
    # 2. 20% Framework/Topic Similarity
    repo_topics = [t.lower() for t in repo.get("topics", [])]
    profile_fws = [f.lower() for f in profile.get("frameworks", [])]
    profile_ints = [i.lower() for i in profile.get("interests", [])]
    combined_prefs = profile_fws + profile_ints
    
    if combined_prefs and repo_topics:
        overlap = len(set(repo_topics).intersection(set(combined_prefs)))
        ratio = min(overlap / min(len(combined_prefs), 3), 1.0)
        score_breakdown["framework_match"] = ratio
        
    # 3. 15% Experience Level Alignment
    # Simplified approximation: large stars/issues -> harder to navigate for beginners
    experience = profile.get("experience_level", "beginner")
    stars = repo.get("stars", 0)
    
    if experience == "beginner":
        score_breakdown["difficulty_match"] = 1.0 if stars < 5000 else 0.5
    elif experience == "intermediate":
        score_breakdown["difficulty_match"] = 1.0 if 1000 < stars < 50000 else 0.8
    else:
        score_breakdown["difficulty_match"] = 1.0 if stars > 10000 else 0.7
        
    # 4. 10% Recency and Activity
    # Assumed decent since it passed eligibility (90 days)
    score_breakdown["recency_match"] = 0.8
    
    # 5. 10% Beginner Friendliness
    score_breakdown["beginner_match"] = 0.7
    
    # 6. 15% Documentation & Maintainer Health
    score_breakdown["health_match"] = 0.8
    
    # Composite score (0-100)
    total = (
        (score_breakdown["language_match"] * 30) +
        (score_breakdown["framework_match"] * 20) +
        (score_breakdown["difficulty_match"] * 15) +
        (score_breakdown["recency_match"] * 10) +
        (score_breakdown["beginner_match"] * 10) +
        (score_breakdown["health_match"] * 15)
    )
    
    return {
        "total_score": round(total, 2),
        "breakdown": score_breakdown
    }
