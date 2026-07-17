"""Background job Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class JobResponse(BaseModel):
    """Returned by GET /api/jobs/:id."""

    job_id: str
    job_type: str
    status: str
    attempt_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
