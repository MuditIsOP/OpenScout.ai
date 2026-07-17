"""Async GitHub REST API client."""

import httpx
from typing import Any

from app.config import settings

class GitHubService:
    def __init__(self):
        # We use a shared app token for unauthenticated calls (e.g. searching repos)
        # to get a higher rate limit (5000/hr) vs completely unauthenticated (60/hr).
        self.token = settings.github_app_token
        self.base_url = "https://api.github.com"

    def _get_headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "OpenScout-AI",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    async def get_user_repos(self, username: str, limit: int = 20) -> list[dict[str, Any]]:
        """Fetch the most recent public repositories for a user."""
        url = f"{self.base_url}/users/{username}/repos"
        params = {
            "type": "owner",
            "sort": "updated",
            "direction": "desc",
            "per_page": limit,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._get_headers(), params=params)
            if resp.status_code == 200:
                return resp.json()
            return []

    async def get_repo_languages(self, full_name: str) -> dict[str, int]:
        """Fetch language byte breakdown for a repository."""
        url = f"{self.base_url}/repos/{full_name}/languages"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._get_headers())
            if resp.status_code == 200:
                return resp.json()
            return {}

    async def get_repo_details(self, full_name: str) -> dict[str, Any]:
        """Fetch metadata for a specific repository."""
        url = f"{self.base_url}/repos/{full_name}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._get_headers())
            resp.raise_for_status()
            return resp.json()

    async def search_repositories(self, query: str, limit: int = 50) -> list[dict[str, Any]]:
        """Search GitHub for repositories matching a query."""
        url = f"{self.base_url}/search/repositories"
        params = {
            "q": query,
            "sort": "stars",
            "order": "desc",
            "per_page": limit,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._get_headers(), params=params)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("items", [])
            return []

# Singleton
github_service = GitHubService()
