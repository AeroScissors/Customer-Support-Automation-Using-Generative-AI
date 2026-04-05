from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal

from app.services.auth_service import (
    authenticate_user,
    create_user,
)
from app.core.auth.dependencies import require_admin

router = APIRouter(prefix="/auth", tags=["Auth"])


# ------------------------------
# Schemas
# ------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: Literal["admin", "agent"]


# ------------------------------
# Login
# ------------------------------
@router.post("/login")
def login(payload: LoginRequest):
    result = authenticate_user(
        payload.username,
        payload.password
    )

    if not result:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    return result


# ------------------------------
# Admin creates users (FINAL)
# ------------------------------
@router.post("/create-user", dependencies=[Depends(require_admin)])
def create_new_user(payload: CreateUserRequest):
    try:
        create_user(
            username=payload.username,
            password=payload.password,
            role=payload.role,
        )
        return {"status": "user created"}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
