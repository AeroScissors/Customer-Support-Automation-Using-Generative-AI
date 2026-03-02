from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Core orchestration pipeline
from app.core.orchestration import orchestrate_query

# Ticket service (INTERNAL USE ONLY)
from app.services.ticket_service import TicketService

# -------------------------------------------------
# Router (PREFIX DEFINED HERE ✅)
# -------------------------------------------------
router = APIRouter(
    prefix="/chat",
    tags=["Customer Chat"],
)

ticket_service = TicketService()

# -------------------------------------------------
# Request / Response Schemas
# -------------------------------------------------
class ChatRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    order_id: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    ticket_id: str
    status: str


# -------------------------------------------------
# Customer Chat Endpoint (ONLY ENTRY POINT)
# -------------------------------------------------
@router.post("/", response_model=ChatResponse)
def customer_chat(payload: ChatRequest):
    """
    Customer-facing chat endpoint.

    RULES:
    - Customers NEVER create tickets directly
    - Tickets are created ONLY here
    - AI internals are NEVER exposed
    """

    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # -------------------------------------------------
        # 1. Run orchestration (AI brain)
        # -------------------------------------------------
        orchestration_result = orchestrate_query(
            query=payload.query
        )

        response_text = orchestration_result.get("final_response")

        if not response_text:
            response_text = (
                "Thanks for reaching out. "
                "Your issue has been forwarded to a support agent."
            )

        # -------------------------------------------------
        # 2. Create ticket (INTERNAL)
        # -------------------------------------------------
        ticket = ticket_service.create_ticket(
            user_id=payload.user_id or "anonymous",
            query=payload.query,
            orchestration_result=orchestration_result,
        )

        # -------------------------------------------------
        # 3. Return CUSTOMER-SAFE response
        # -------------------------------------------------
        return ChatResponse(
            message=response_text,
            ticket_id=ticket.ticket_id,
            status=ticket.status,
        )

    except Exception:
        # Absolute safety net — customer never sees internals
        return ChatResponse(
            message=(
                "We’re experiencing a temporary issue. "
                "Your request has been forwarded to our support team."
            ),
            ticket_id="PENDING",
            status="ESCALATED",
        )
