"""Clerk JWT verification dependency for FastAPI.

Fetches Clerk's JWKS, verifies RS256 JWT signatures, and extracts user_id.
"""

import time
from typing import Any

import httpx
from fastapi import Depends, Request
from jose import JWTError, jwt

from app.config import settings
from app.core.exceptions import UnauthorizedError

# --------------------------------------------------------------------------- #
# JWKS cache
# --------------------------------------------------------------------------- #
_jwks_cache: dict[str, Any] | None = None
_jwks_fetched_at: float = 0.0
_JWKS_CACHE_TTL = 3600  # 1 hour


async def _get_jwks() -> dict[str, Any]:
    """Fetch and cache Clerk's JWKS public keys."""
    global _jwks_cache, _jwks_fetched_at

    if _jwks_cache and (time.time() - _jwks_fetched_at < _JWKS_CACHE_TTL):
        return _jwks_cache

    clerk_domain = settings.clerk_domain
    if not clerk_domain:
        # Derive domain from publishable key if CLERK_DOMAIN is not set.
        # Clerk publishable keys encode the frontend API domain in base64
        # after the "pk_test_" or "pk_live_" prefix.
        pk = settings.clerk_publishable_key
        if pk:
            import base64

            # Strip prefix (pk_test_ or pk_live_)
            encoded = pk.split("_", 2)[-1]
            # Add padding
            padded = encoded + "=" * (4 - len(encoded) % 4)
            try:
                clerk_domain = base64.b64decode(padded).decode("utf-8").rstrip("$")
            except Exception:
                raise UnauthorizedError(
                    detail="Cannot derive Clerk domain from publishable key"
                )
        else:
            raise UnauthorizedError(detail="CLERK_DOMAIN is not configured")

    jwks_url = f"https://{clerk_domain}/.well-known/jwks.json"

    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url, timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        _jwks_fetched_at = time.time()

    return _jwks_cache


# --------------------------------------------------------------------------- #
# JWT verification dependency
# --------------------------------------------------------------------------- #


async def get_current_user_id(request: Request) -> str:
    """FastAPI dependency — extracts and verifies the Clerk JWT.

    Returns the ``sub`` claim (Clerk user ID) on success.
    Raises ``UnauthorizedError`` on any failure.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise UnauthorizedError(detail="Missing or malformed Authorization header")

    token = auth_header.split(" ", 1)[1]

    try:
        jwks = await _get_jwks()
        # Decode header to find the right key
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        rsa_key: dict[str, str] = {}
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key.get("use", "sig"),
                    "n": key["n"],
                    "e": key["e"],
                }
                break

        if not rsa_key:
            raise UnauthorizedError(detail="JWT key ID not found in JWKS")

        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk JWTs may not include aud
        )

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError(detail="JWT missing 'sub' claim")

        return user_id

    except JWTError as exc:
        raise UnauthorizedError(detail=f"JWT verification failed: {exc}")
