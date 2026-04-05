#File: backend/app/api/agent.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

from app.services import agent_service
from app.db.mongo import users_collection
from app.core.auth.jwt import get_current_user


router = APIRouter(
    prefix="/agent",
    tags=["Agent"],
)


# -------------------------------
# Request Models
# -------------------------------

class CreateAgentRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=4)

    @validator("username")
    def validate_username(cls, v: str):
        v = v.strip()
        if not v:
            raise ValueError("Username cannot be empty")
        return v

    @validator("password")
    def validate_password(cls, v: str):
        v = v.strip()
        if not v:
            raise ValueError("Password cannot be empty")
        return v


class RespondRequest(BaseModel):
    ticket_id: str
    response: str


class CloseRequest(BaseModel):
    ticket_id: str
    reason: Optional[str] = None


# -------------------------------
# Metrics
# -------------------------------

@router.get("/metrics")
def get_ticket_metrics():
    return agent_service.get_ticket_metrics()


@router.get("/workforce")
def get_agent_metrics():
    return agent_service.get_agent_metrics()


# -------------------------------
# Agents
# -------------------------------

@router.get("/all")
def get_all_agents():
    return agent_service.get_all_agents()


@router.post("/create")
def create_agent(payload: CreateAgentRequest):
    username = payload.username.strip()
    password = payload.password.strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")

    try:
        return agent_service.create_agent(
            username=username,
            password=password,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------
# Tickets
# -------------------------------

@router.get("/escalated")
def get_escalated_tickets():
    return agent_service.get_escalated_tickets()


@router.post("/respond")
def respond_to_ticket(payload: RespondRequest):
    try:
        agent_service.respond_to_ticket(
            ticket_id=payload.ticket_id,
            agent_response=payload.response,
        )
        return {"status": "resolved"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/close")
def close_ticket(payload: CloseRequest):
    try:
        agent_service.close_ticket(
            ticket_id=payload.ticket_id,
            reason=payload.reason,
        )
        return {"status": "closed"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# -------------------------------
# Agent Heartbeat
# -------------------------------

@router.post("/ping")
def agent_ping(current_user: dict = Depends(get_current_user)):
    username = current_user["sub"]

    users_collection.update_one(
        {"username": username},
        {
            "$set": {
                "status": "active",
                "last_seen": datetime.utcnow(),
            }
        }
    )

    return {"status": "online"}