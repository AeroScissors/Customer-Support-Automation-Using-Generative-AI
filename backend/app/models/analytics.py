from pydantic import BaseModel, Field
from datetime import date
from typing import Optional


class Analytics(BaseModel):
    """
    Read-only analytics snapshot for a single day.
    This data is system-generated, not user input.
    """

    date: date = Field(..., description="Date of analytics snapshot")

    total_tickets: int = Field(
        0, description="Total tickets created on this date"
    )

    ai_resolved_count: int = Field(
        0, description="Tickets resolved by AI"
    )

    escalated_count: int = Field(
        0, description="Tickets escalated to human agents"
    )

    avg_confidence: Optional[float] = Field(
        None, description="Average AI confidence score"
    )

    avg_resolution_time: Optional[float] = Field(
        None, description="Average resolution time (seconds)"
    )
