"""MongoDB-backed durable job queue."""

from datetime import datetime, timezone
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.core.exceptions import ConflictError, NotFoundError

async def create_job(
    db: AsyncIOMotorDatabase,
    job_type: str,
    payload: dict[str, Any],
    idempotency_key: str,
) -> str:
    """Create a new background job.
    
    Raises ConflictError if a job with the same idempotency_key already exists.
    """
    now = datetime.now(timezone.utc)
    job_doc = {
        "job_type": job_type,
        "payload": payload,
        "idempotency_key": idempotency_key,
        "status": "queued",
        "attempt_count": 0,
        "created_at": now,
        "updated_at": now,
    }

    try:
        result = await db["background_jobs"].insert_one(job_doc)
        return str(result.inserted_id)
    except DuplicateKeyError:
        # Check if the existing job is still queued or running
        existing = await db["background_jobs"].find_one({"idempotency_key": idempotency_key})
        if existing:
            if existing["status"] in ("queued", "running"):
                return str(existing["_id"])
            # If completed/failed, we could potentially create a new one with a new key,
            # but for this MVP we just return Conflict
        raise ConflictError(detail=f"Job with idempotency_key {idempotency_key} already exists.")

async def get_job(db: AsyncIOMotorDatabase, job_id: str) -> dict[str, Any]:
    """Retrieve job by ID."""
    from bson.objectid import ObjectId
    try:
        oid = ObjectId(job_id)
    except Exception:
        raise NotFoundError("Invalid Job ID format")
        
    job = await db["background_jobs"].find_one({"_id": oid})
    if not job:
        raise NotFoundError("Job not found")
    
    job["job_id"] = str(job["_id"])
    return job

async def update_job_status(
    db: AsyncIOMotorDatabase, 
    job_id: str, 
    status: str, 
    error: Optional[str] = None
) -> None:
    """Update job status and timestamp."""
    from bson.objectid import ObjectId
    now = datetime.now(timezone.utc)
    update_data = {"status": status, "updated_at": now}
    if error:
        update_data["error"] = error
        
    await db["background_jobs"].update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update_data}
    )
