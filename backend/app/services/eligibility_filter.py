"""Deterministic eligibility filter for candidate repositories."""

from typing import Any
from datetime import datetime, timezone, timedelta

def check_eligibility(repo: dict[str, Any]) -> tuple[bool, list[str]]:
    """Verify a candidate repository meets minimum quality gates."""
    reasons = []
    
    # 1. Public and not archived
    if repo.get("fork"):
        reasons.append("Repository is a fork")
    if repo.get("archived"):
        reasons.append("Repository is archived")
        
    # 2. Recent Activity (last 90 days)
    pushed_at_str = repo.get("pushed_at")
    if pushed_at_str:
        # GitHub returns format "2023-11-20T12:00:00Z"
        try:
            pushed_at = datetime.fromisoformat(pushed_at_str.replace("Z", "+00:00"))
            cutoff = datetime.now(timezone.utc) - timedelta(days=90)
            if pushed_at < cutoff:
                reasons.append("No commits in the last 90 days")
        except ValueError:
            pass
            
    # 3. Readme minimum size - approximated here if not explicitly fetched
    # A full implementation would fetch the README, but for this MVP search level we assume pass 
    # unless we fetch it in a deeper analysis phase.
    
    # 4. Valid license
    if not repo.get("license"):
        reasons.append("Missing open-source license")
        
    # 5. Popularity Minimum
    stars = repo.get("stargazers_count", 0)
    forks = repo.get("forks_count", 0)
    
    if stars < 10:
        reasons.append("Below minimum star count (10)")
    if forks < 2:
        reasons.append("Below minimum fork count (2)")
        
    # 6. Community Size (would require contributors endpoint, skipped for search MVP)

    is_eligible = len(reasons) == 0
    return is_eligible, reasons
