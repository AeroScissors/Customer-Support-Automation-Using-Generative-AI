# File: backend/app/api/chat.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.orchestration import orchestrate_query
from app.services.ticket_service import TicketService


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
# Customer Chat Endpoint
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

    # -----------------------------
    # Input validation
    # -----------------------------
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # -----------------------------
        # 1. Run AI orchestration
        # -----------------------------
        orchestration_result = orchestrate_query(
            query=payload.query
        )

        # -----------------------------
        # 2. Clean response handling (FIXED)
        # -----------------------------
        response_text = (
            orchestration_result.get("final_response")
            or "Your request has been forwarded to a support agent."
        )

        # -----------------------------
        # 3. Create ticket
        # -----------------------------
        ticket = ticket_service.create_ticket(
            user_id=payload.user_id or "anonymous",
            query=payload.query,
            orchestration_result=orchestration_result,
        )

        # -----------------------------
        # 4. Ensure valid status (SAFETY)
        # -----------------------------
        status = ticket.status
        if status not in ["AI_RESOLVED", "ESCALATED"]:
            status = "ESCALATED"

        # -----------------------------
        # 5. Return response
        # -----------------------------
        return ChatResponse(
            message=response_text,
            ticket_id=ticket.ticket_id,
            status=status,
        )

    except Exception:
        # -----------------------------
        # Absolute fallback (never expose internals)
        # -----------------------------
        return ChatResponse(
            message=(
                "We’re experiencing a temporary issue. "
                "Your request has been forwarded to our support team."
            ),
            ticket_id="PENDING",
            status="ESCALATED",
        )