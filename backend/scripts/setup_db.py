import os
import json
import sys
from pymongo import MongoClient
from pymongo.errors import PyMongoError

def load_dotenv():
    # Try finding .env in script directory, backend directory, or root directory
    search_dirs = [
        os.path.dirname(__file__),
        os.path.join(os.path.dirname(__file__), ".."),
        os.path.join(os.path.dirname(__file__), "..", "..")
    ]
    for d in search_dirs:
        dotenv_path = os.path.join(d, ".env")
        if os.path.exists(dotenv_path):
            with open(dotenv_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        val = parts[1].strip().strip('"').strip("'")
                        if key not in os.environ:
                            os.environ[key] = val

# Load local environment variables
load_dotenv()

# Connection config from environment
MONGODB_URI = os.environ.get("MONGODB_URI")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "openscoutai")

# Path to Phase 1 Schema file
SCHEMA_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "Documentation", "phase_1_schema.json")

def setup_database():
    if not MONGODB_URI:
        print("Error: MONGODB_URI environment variable is not set.")
        print("Please configure it in a .env file or set it in your environment.")
        sys.exit(1)
        
    # Mask password for logging
    connection_display = MONGODB_URI
    if "@" in MONGODB_URI:
        parts = MONGODB_URI.split("@")
        connection_display = f"***:***@{parts[1]}"
    print(f"Connecting to MongoDB Atlas at: {connection_display}")
    
    try:
        client = MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        # Force connection verification
        client.admin.command('ping')
        print("MongoDB Connection successful.")
    except PyMongoError as e:
        print(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)

    # Resolve schema file path
    if not os.path.exists(SCHEMA_FILE_PATH):
        print(f"Schema file not found at: {SCHEMA_FILE_PATH}")
        sys.exit(1)

    with open(SCHEMA_FILE_PATH, "r") as f:
        schema_data = json.load(f)

    collections_config = schema_data.get("collections", {})

    print("\n--- Initializing Phase 1 Core Collections ---")
    for coll_name, coll_config in collections_config.items():
        print(f"\nSetting up collection: {coll_name}")
        validator = coll_config.get("validator", {})
        indexes = coll_config.get("indexes", [])

        # Create or modify collection with validation
        try:
            existing_colls = db.list_collection_names()
            if coll_name not in existing_colls:
                db.create_collection(coll_name, validator={"$jsonSchema": validator})
                print(f" - Collection '{coll_name}' created with JSON Schema validation.")
            else:
                db.command("collMod", coll_name, validator={"$jsonSchema": validator})
                print(f" - Collection '{coll_name}' schema validator updated.")
        except PyMongoError as e:
            print(f" - Error configuring collection {coll_name}: {e}")

        # Create indexes
        for idx in indexes:
            key_spec = list(idx.get("key", {}).items())
            is_unique = idx.get("unique", False)
            if not key_spec:
                continue
            
            try:
                # Key format for pymongo is a list of tuples: [("field", direction)]
                # e.g., [("clerk_id", 1)]
                formatted_keys = [(k, v) for k, v in key_spec]
                idx_name = db[coll_name].create_index(formatted_keys, unique=is_unique)
                print(f"   * Index created: {idx_name} (unique={is_unique})")
            except PyMongoError as e:
                print(f"   * Error creating index on {coll_name} for key {key_spec}: {e}")

    # Phase 2 & 3 Deferred Collections setup (without schema validators, just matching indexes from SCHEMA.md)
    print("\n--- Initializing Phase 2 & 3 Deferred Collections & Indexes ---")
    deferred_collections = {
        "repository_analyses": [
            {"key": {"repository_id": 1, "commit_sha": 1, "analysis_version": 1}, "unique": True}
        ],
        "contribution_opportunities": [
            {"key": {"repository_id": 1, "tier": 1, "current_issue_state": 1}, "unique": False}
        ],
        "user_repository_states": [
            {"key": {"user_id": 1, "repository_id": 1}, "unique": True},
            {"key": {"user_id": 1, "is_saved": 1}, "unique": False},
            {"key": {"user_id": 1, "last_viewed_at": -1}, "unique": False}
        ],
        "blueprints": [
            {"key": {"blueprint_group_id": 1, "version": 1}, "unique": True},
            {"key": {"idempotency_key": 1}, "unique": True},
            {"key": {"user_id": 1, "created_at": -1}, "unique": False}
        ],
        "handoff_events": [
            {"key": {"idempotency_key": 1}, "unique": True},
            {"key": {"blueprint_id": 1}, "unique": False}
        ],
        "audit_logs": [
            {"key": {"user_id": 1, "action": 1, "created_at": -1}, "unique": False}
        ]
    }

    for coll_name, indexes in deferred_collections.items():
        print(f"\nSetting up collection: {coll_name}")
        try:
            existing_colls = db.list_collection_names()
            if coll_name not in existing_colls:
                db.create_collection(coll_name)
                print(f" - Collection '{coll_name}' created.")
            else:
                print(f" - Collection '{coll_name}' already exists.")
        except PyMongoError as e:
            print(f" - Error creating collection {coll_name}: {e}")

        # Create indexes
        for idx in indexes:
            key_spec = list(idx.get("key", {}).items())
            is_unique = idx.get("unique", False)
            if not key_spec:
                continue
            
            try:
                formatted_keys = [(k, v) for k, v in key_spec]
                idx_name = db[coll_name].create_index(formatted_keys, unique=is_unique)
                print(f"   * Index created: {idx_name} (unique={is_unique})")
            except PyMongoError as e:
                print(f"   * Error creating index on {coll_name} for key {key_spec}: {e}")

    print("\nDatabase setup complete!")

if __name__ == "__main__":
    setup_database()
