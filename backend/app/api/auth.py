"""Authentication endpoints."""

from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, Header, Request, status
from svix.webhooks import Webhook, WebhookVerificationError

from app.config import settings
from app.core.auth import get_current_user_id
from app.core.exceptions import UnauthorizedError, NotFoundError
from app.db.mongodb import get_database
from app.models.user import UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/webhook/clerk", status_code=status.HTTP_200_OK)
async def clerk_webhook(
    request: Request,
    svix_id: str = Header(..., alias="svix-id"),
    svix_timestamp: str = Header(..., alias="svix-timestamp"),
    svix_signature: str = Header(..., alias="svix-signature"),
    db=Depends(get_database),
):
    """Sync Clerk user events to MongoDB."""
    payload = await request.body()
    headers = {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
    }

    try:
        wh = Webhook(settings.clerk_webhook_secret)
        evt = wh.verify(payload, headers)
    except WebhookVerificationError:
        raise UnauthorizedError(detail="Invalid Svix signature")

    event_type = evt.get("type")
    data = evt.get("data", {})
    clerk_id = data.get("id")

    if not clerk_id:
        return {"status": "ignored"}

    users_collection = db["users"]
    now = datetime.now(timezone.utc)

    if event_type in ("user.created", "user.updated"):
        # Extract GitHub info from external_accounts
        github_id = ""
        github_username = ""
        avatar_url = data.get("image_url", "")
        
        # In this simplified MVP, we assume the first external account is GitHub
        external_accounts = data.get("external_accounts", [])
        if external_accounts:
            github_account = next(
                (acc for acc in external_accounts if acc.get("provider") == "oauth_github"),
                None
            )
            if github_account:
                github_id = str(github_account.get("provider_user_id", ""))
                github_username = github_account.get("username", "")

        user_doc = {
            "clerk_id": clerk_id,
            "github_id": github_id,
            "github_username": github_username,
            "avatar_url": avatar_url,
            "updated_at": now,
        }

        # Find existing
        existing = await users_collection.find_one({"clerk_id": clerk_id})
        
        if existing:
            await users_collection.update_one({"clerk_id": clerk_id}, {"$set": user_doc})
            user_id = str(existing["_id"])
        else:
            user_doc["created_at"] = now
            user_doc["profile_analysis_status"] = "queued"
            user_doc["last_login_at"] = now
            # We use clerk_id as the primary reference internally for simpler lookups
            result = await users_collection.insert_one(user_doc)
            user_id = str(result.inserted_id)

            # Queue profile analysis job (Implementation deferred to job_service)
            from app.services.job_service import create_job
            await create_job(
                db, 
                job_type="profile_analysis", 
                payload={"user_id": clerk_id, "github_username": github_username},
                idempotency_key=f"profile-init-{clerk_id}"
            )

    elif event_type == "user.deleted":
        # Cascade delete (Simplified for MVP)
        await users_collection.delete_one({"clerk_id": clerk_id})
        await db["user_preferences"].delete_one({"user_id": clerk_id})
        await db["developer_profiles"].delete_one({"user_id": clerk_id})

    return {"status": "success"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    clerk_id: str = Depends(get_current_user_id),
    db=Depends(get_database),
):
    """Retrieve the currently authenticated user's profile."""
    user = await db["users"].find_one({"clerk_id": clerk_id})
    if not user:
        raise NotFoundError(detail="User not found in database. Webhook may be delayed.")
        
    return UserResponse(
        user_id=str(user["_id"]),
        clerk_id=user["clerk_id"],
        github_username=user.get("github_username", ""),
        avatar_url=user.get("avatar_url", ""),
        profile_analysis_status=user.get("profile_analysis_status", "pending"),
        created_at=user.get("created_at"),
        last_login_at=user.get("last_login_at"),
    )
