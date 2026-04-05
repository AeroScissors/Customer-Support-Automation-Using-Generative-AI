from fastapi import APIRouter, HTTPException
from typing import List, Literal
from pydantic import BaseModel
from datetime import datetime

from app.models.ticket import (
    TicketResponse,
    TicketStatus,
)
from app.services.ticket_service import TicketService

# --------------------------------------------------
# Router (PREFIX DEFINED HERE ✅)
# --------------------------------------------------
router = APIRouter(
    prefix="/tickets",
    tags=["Tickets (Internal / Agent)"],
)

service = TicketService()


# --------------------------------------------------
# Helper: normalize legacy tickets
# --------------------------------------------------
def normalize_ticket(ticket: dict) -> dict:
    """
    Ensure ticket always has `messages`.
    Backward-compatible with legacy tickets.
    """

    # If messages already exist and are non-empty → OK
    if "messages" in ticket and ticket["messages"]:
        return ticket

    messages = []

    # Legacy customer query → first message
    if ticket.get("query"):
        messages.append({
            "sender": "customer",
            "content": ticket["query"],
            "timestamp": ticket.get("created_at"),
        })

    # Legacy AI response → second message
    if ticket.get("ai_response"):
        messages.append({
            "sender": "ai",
            "content": ticket["ai_response"],
            "timestamp": ticket.get("created_at"),
        })

    ticket["messages"] = messages
    return ticket


# --------------------------------------------------
# Get Ticket by ID (Agent view)
# --------------------------------------------------
@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: str):
    ticket = service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket = normalize_ticket(ticket)
    return TicketResponse(**ticket)


# --------------------------------------------------
# List All Tickets (Agent queue)
# --------------------------------------------------
@router.get("/", response_model=List[TicketResponse])
def list_tickets():
    tickets = service.list_tickets()
    normalized = [normalize_ticket(t) for t in tickets]

    # 🔥 Fix: Normalize old message format (message -> content)
    for ticket in normalized:
        if "messages" in ticket:
            for msg in ticket["messages"]:
                if "message" in msg and "content" not in msg:
                    msg["content"] = msg["message"]

    return [TicketResponse(**t) for t in normalized]


# --------------------------------------------------
# Update Ticket Status (Agent action)
# --------------------------------------------------
@router.patch("/{ticket_id}/status")
def update_ticket_status(ticket_id: str, status: TicketStatus):
    updated = service.update_ticket_status(ticket_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return {"status": "updated"}


# ==================================================
# Add Message to Ticket (Agent Chat)
# ==================================================
class AddMessagePayload(BaseModel):
    sender: Literal["agent", "customer"]
    content: str


@router.post("/{ticket_id}/message", response_model=TicketResponse)
def add_ticket_message(ticket_id: str, payload: AddMessagePayload):
    message = {
        "sender": payload.sender,
        "content": payload.content,
        "timestamp": datetime.utcnow(),
    }

    updated_ticket = service.append_message(
        ticket_id=ticket_id,
        message=message,
    )

    if not updated_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    updated_ticket = normalize_ticket(updated_ticket)
    return TicketResponse(**updated_ticket)