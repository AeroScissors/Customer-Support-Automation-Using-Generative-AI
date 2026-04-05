from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# 🔐 AUTH GUARDS
from app.core.auth.jwt import get_current_user, get_current_admin
from app.core.auth.dependencies import require_agent
from app.db.mongo import users_collection

from app.services.agent_service import (
    get_escalated_tickets,
    respond_to_ticket,
    close_ticket,
    get_agent_metrics,
    create_agent,
    get_all_agents
)

# -------------------------------------------------
# Router
# -------------------------------------------------
router = APIRouter(
    prefix="/agent",
    tags=["Human Agent"],
)

# -------------------------------------------------
# Schemas
# -------------------------------------------------
class TicketResponse(BaseModel):
    ticket_id: str
    customer_query: str
    ai_response: Optional[str]
    confidence_score: float
    escalation_reason: str
    status: str

class AgentReplyRequest(BaseModel):
    ticket_id: str
    agent_response: str

class CloseTicketRequest(BaseModel):
    ticket_id: str
    reason: Optional[str] = "Closed by agent"

# 🔥 NEW: Schema for Agent Provisioning
class AgentCreateRequest(BaseModel):
    username: str
    password: str

# -------------------------------------------------
# 🔥 NEW: Agent Ping (Heartbeat)
# -------------------------------------------------
@router.post("/ping")
def agent_ping(current_user: dict = Depends(get_current_user)):
    """
    Updates agent last_seen timestamp.
    Called periodically by Agent Dashboard.
    """

    print("PING USER:", current_user)

    # Validate username exists in token
    username = current_user.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database connection error")

    # Update last_seen using the username from the token
    users_collection.update_one(
        {"username": username},
        {"$set": {"last_seen": datetime.utcnow()}}
    )

    return {"status": "updated"}

# -------------------------------------------------
# 🔥 NEW: GET /agent/all (Admin Only)
# -------------------------------------------------
@router.get("/all")
def fetch_all_agents(admin=Depends(get_current_admin)):
    """
    Returns a list of all provisioned support agents.
    Allows the Admin to monitor the workforce handling escalated queries. 
    """
    try:
        return get_all_agents()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to fetch agents: {str(e)}",
        )

# -------------------------------------------------
# GET /agent/metrics
# -------------------------------------------------
@router.get("/metrics")
def fetch_agent_metrics(current_user=Depends(get_current_user)):
    """
    Returns real-time workforce status and ticket load.
    Matches the 'Agents Online', 'Active', 'Idle' dashboard cards.
    """
    try:
        return get_agent_metrics()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch agent metrics",
        )

# -------------------------------------------------
# ✅ NEW: GET /agent/ticket-metrics
# -------------------------------------------------
@router.get("/ticket-metrics")
def fetch_ticket_metrics(current_user=Depends(get_current_user)):
    """
    Returns aggregated ticket metrics for Agent Dashboard KPI strip.
    """
    try:
        from app.services.agent_service import get_ticket_metrics
        return get_ticket_metrics()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to fetch ticket metrics: {str(e)}",
        )

# -------------------------------------------------
# POST /agent/create (🔥 NEW: ADMIN ONLY)
# -------------------------------------------------
@router.post("/create")
def provision_agent(payload: AgentCreateRequest, admin=Depends(get_current_admin)):
    """
    Allows Admin to issue credentials for a new support agent.
    Implements the 'Create Agent Account' tab from the dashboard. 
    """
    try:
        return create_agent(username=payload.username, password=payload.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create agent account")

# -------------------------------------------------
# GET /agent/tickets
# -------------------------------------------------
@router.get("/tickets", response_model=List[TicketResponse])
def fetch_escalated_tickets(current_user=Depends(get_current_user)):
    """
    Returns all tickets that require human intervention.
    """
    try:
        return get_escalated_tickets()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch escalated tickets",
        )

# -------------------------------------------------
# POST /agent/respond
# -------------------------------------------------
@router.post("/respond")
def agent_respond(payload: AgentReplyRequest, current_user=Depends(get_current_user)):
    """
    Allows agent to respond and resolve a ticket.
    """
    if not payload.agent_response.strip():
        raise HTTPException(
            status_code=400,
            detail="Agent response cannot be empty",
        )

    try:
        respond_to_ticket(
            ticket_id=payload.ticket_id,
            agent_response=payload.agent_response,
        )
        return {
            "status": "success",
            "message": "Ticket resolved successfully",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to respond to ticket",
        )