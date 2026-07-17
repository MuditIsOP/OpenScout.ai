"""FastAPI main application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.mongodb import mongodb

# Routers
from app.api import auth, profile, recommendations, jobs, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the FastAPI application."""
    # Startup
    await mongodb.connect()
    yield
    # Shutdown
    await mongodb.disconnect()

app = FastAPI(
    title="OpenScout.ai API",
    description="Backend services for OpenScout.ai open-source recommendation platform.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Healthcheck
@app.get("/health", tags=["health"])
async def health_check():
    """Basic API healthcheck."""
    return {"status": "ok", "message": "OpenScout.ai API is running."}

# Include all routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(recommendations.router)
app.include_router(jobs.router)
app.include_router(dashboard.router)
