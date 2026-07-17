"""Motor async MongoDB connection manager.

Provides a singleton database handle used across the application via
FastAPI's dependency injection system.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings


class MongoDB:
    """Manages the Motor client lifecycle."""

    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        """Open the Motor connection pool."""
        self.client = AsyncIOMotorClient(settings.mongodb_uri)
        self.db = self.client[settings.mongodb_db_name]
        # Verify connectivity
        await self.client.admin.command("ping")
        print(f"[*] Connected to MongoDB: {settings.mongodb_db_name}")

    async def disconnect(self) -> None:
        """Close the Motor connection pool."""
        if self.client:
            self.client.close()
            print("[*] MongoDB connection closed.")


# Singleton instance
mongodb = MongoDB()


def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency that returns the active database handle."""
    if mongodb.db is None:
        raise RuntimeError("Database not connected. Call mongodb.connect() first.")
    return mongodb.db
