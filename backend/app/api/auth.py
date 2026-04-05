from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal

from app.services.auth_service import authenticate_user, create_user
from app.core.auth.dependencies import require_admin
from app.core.auth.jwt import get_current_user
from app.db.mongo import db

router = APIRouter(prefix="/auth", tags=["Auth"])

users_collection = db["users"]


class LoginRequest(BaseModel):
    username: str
    password: str


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: Literal["admin", "agent"]


@router.post("/login")
def login(payload: LoginRequest):
    result = authenticate_user(payload.username, payload.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return result


# ✅ NEW: Get current user profile
@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    username = current_user.get("sub")
    user = users_collection.find_one({"username": username}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/create-user", dependencies=[Depends(require_admin)])
def create_new_user(payload: CreateUserRequest):
    try:
        create_user(username=payload.username, password=payload.password, role=payload.role)
        return {"status": "user created"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) 