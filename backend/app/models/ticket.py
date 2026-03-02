from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


# --------------------------------------------------
# Ticket Status Enum
# --------------------------------------------------
class TicketStatus(str, Enum):
    RESOLVED = "RESOLVED"
    AI_RESOLVED = "AI_RESOLVED"
    ESCALATED = "ESCALATED"
    CLOSED = "CLOSED"


# --------------------------------------------------
# Ticket Message Model (NEW)
# --------------------------------------------------
class TicketMessage(BaseModel):
    sender: Literal["customer", "ai", "agent"]
    content: str
    timestamp: datetime


# --------------------------------------------------
# Ticket Create Model (INPUT)
# --------------------------------------------------
class TicketCreate(BaseModel):
    user_id: str = Field(..., description="Customer identifier")
    query: str = Field(..., description="Customer message")


# --------------------------------------------------
# Ticket Response Model (OUTPUT)
# --------------------------------------------------
class TicketResponse(BaseModel):
    ticket_id: str
    user_id: str
    status: TicketStatus

    messages: List[TicketMessage]

    confidence_score: Optional[float] = Field(None, ge=0, le=1)

    created_at: datetime
    resolved_at: Optional[datetime] = None


# --------------------------------------------------
# Ticket Persistence Model (DB)
# --------------------------------------------------
class Ticket(BaseModel):
    ticket_id: str
    user_id: str

    messages: List[TicketMessage]

    confidence_score: Optional[float]

    decision: str
    decision_reason: str

    status: TicketStatus

    created_at: datetime
    resolved_at: Optional[datetime] = None
