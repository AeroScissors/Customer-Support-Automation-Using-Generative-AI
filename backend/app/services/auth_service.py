from app.db.mongo import db
from app.utils.security import (
    hash_password,
    verify_password,
)
from app.core.auth.jwt import create_access_token
from app.models.user import User
import uuid


# -------------------------------------------------
# Collection
# -------------------------------------------------
users_collection = db["users"]


# -------------------------------------------------
# Authenticate user (login)
# -------------------------------------------------
def authenticate_user(username: str, password: str):
    """
    Verifies user credentials and returns JWT on success.
    """

    user = users_collection.find_one({"username": username})
    if not user:
        return None

    if not verify_password(password, user["password_hash"]):
        return None

    # ✅ CORRECT JWT FUNCTION (core/auth/jwt.py)
    # 🔥 FIX: Use username as subject instead of user_id
    token = create_access_token(
        subject=user["username"], 
        role=user["role"],
    )

    return {
        "access_token": token,
        "role": user["role"],
    }


# -------------------------------------------------
# Create user (admin-controlled, with bootstrap)
# -------------------------------------------------
def create_user(username: str, password: str, role: str):
    """
    Creates a new user.

    Bootstrap rule:
    - If users collection is empty, first user MUST be admin.
    - After that, only admin can create users (enforced at API layer).
    """

    # 🔐 BOOTSTRAP CHECK
    users_count = users_collection.count_documents({})

    if users_count == 0 and role != "admin":
        raise ValueError("First user must be an admin")

    if users_collection.find_one({"username": username}):
        raise ValueError("Username already exists")

    user = User(
        user_id=f"user_{uuid.uuid4().hex[:8]}",
        username=username,
        password_hash=hash_password(password),
        role=role,
    )

    users_collection.insert_one(user.dict())