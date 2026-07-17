"""Application-level exception classes mapped to HTTP status codes."""

from fastapi import HTTPException, status


class NotFoundError(HTTPException):
    """404 — Resource not found."""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ConflictError(HTTPException):
    """409 — Duplicate / idempotency conflict."""

    def __init__(self, detail: str = "Conflict — resource already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class PreconditionFailedError(HTTPException):
    """412 — A required precondition was not met."""

    def __init__(self, detail: str = "Precondition failed"):
        super().__init__(
            status_code=status.HTTP_412_PRECONDITION_FAILED, detail=detail
        )


class UnauthorizedError(HTTPException):
    """401 — Authentication failed or missing."""

    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenError(HTTPException):
    """403 — Authenticated but not allowed."""

    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
