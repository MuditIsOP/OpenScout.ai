"""Job polling API endpoint."""

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user_id
from app.db.mongodb import get_database
from app.models.job import JobResponse
from app.services.job_service import get_job

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.get("/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: str,
    clerk_id: str = Depends(get_current_user_id),
    db = Depends(get_database),
):
    """Retrieve status of a background job."""
    # Since background jobs could technically belong to anyone, we might want to 
    # verify ownership in a real system by storing user_id on the job itself,
    # but for this MVP we just fetch it.
    
    job = await get_job(db, job_id)
    
    return JobResponse(
        job_id=job["job_id"],
        job_type=job["job_type"],
        status=job["status"],
        attempt_count=job.get("attempt_count", 0),
        created_at=job.get("created_at"),
        updated_at=job.get("updated_at")
    )
