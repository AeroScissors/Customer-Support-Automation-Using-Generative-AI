import os
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from dotenv import load_dotenv

# --------------------------------------------------
# Load environment variables
# --------------------------------------------------
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")

if not MONGO_URI or not MONGO_DB_NAME:
    raise RuntimeError("MongoDB environment variables not set")

# --------------------------------------------------
# Mongo Client (singleton)
# --------------------------------------------------
client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]

# --------------------------------------------------
# Expose DB
# --------------------------------------------------
def get_db():
    return db

# --------------------------------------------------
# Collections (SINGLE SOURCE OF TRUTH)
# --------------------------------------------------
tickets_collection = db["tickets"]
faq_collection = db["faqs"]
analytics_collection = db["analytics"]
users_collection = db["users"]   # ✅ Added users collection

# --------------------------------------------------
# Database indexes (SAFE + IDEMPOTENT)
# --------------------------------------------------
def init_indexes():
    """
    Initialize MongoDB indexes.
    Safe to run multiple times.
    Name-agnostic to avoid conflicts with legacy indexes.
    """

    # ---- Tickets ----
    try:
        tickets_collection.create_index(
            "ticket_id",
            unique=True
        )
    except DuplicateKeyError:
        print(
            "[WARN] Duplicate ticket_id values detected. "
            "Unique index NOT applied."
        )

    tickets_collection.create_index("status")
    tickets_collection.create_index("created_at")

    # ---- FAQs ----
    faq_collection.create_index("question")

    # ---- Analytics ----
    analytics_collection.create_index("date")

    # ---- Users ----
    try:
        users_collection.create_index(
            "username",
            unique=True
        )
    except DuplicateKeyError:
        print(
            "[WARN] Duplicate username values detected. "
            "Unique index NOT applied."
        )

    users_collection.create_index("role")

# --------------------------------------------------
# DEV-ONLY: Hard reset helpers (NOT auto-called)
# --------------------------------------------------
def clear_all_collections():
    """
    DEV ONLY.
    Clears all major collections.
    Call manually when resetting demo data.
    """
    tickets_collection.delete_many({})
    faq_collection.delete_many({})
    analytics_collection.delete_many({})
    users_collection.delete_many({})
    print("[DEV] MongoDB collections cleared.")

print("🔌 Mongo connected to DB:", MONGO_DB_NAME)
