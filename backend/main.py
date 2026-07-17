from fastapi import FastAPI

app = FastAPI(
    title="OpenScout.ai API Backend",
    description="FastAPI backend engine supporting profile analysis, repository evaluations, and contribution blueprints.",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to OpenScout.ai API Server",
        "docs_url": "/docs",
        "status": "healthy"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
