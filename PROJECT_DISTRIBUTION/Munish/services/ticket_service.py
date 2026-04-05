from typing import Optional, Dict, List
from datetime import datetime
import uuid

from app.db.mongo import get_db
from app.models.ticket import (
    Ticket,
    TicketResponse,
    TicketStatus,
)


class TicketService:
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.tickets

    # --------------------------------------------------
    # Create Ticket (CORE ENTRY POINT)
    # --------------------------------------------------
    def create_ticket(
        self,
        user_id: str,
        query: str,
        orchestration_result: Dict
    ) -> TicketResponse:
        """
        Creates a ticket as an immutable snapshot
        of orchestration output, now conversation-based.
        """

        # ---- Guaranteed-unique ticket_id ----
        ticket_id = f"TICKET-{uuid.uuid4().hex[:8].upper()}"

        status = (
            TicketStatus.AI_RESOLVED
            if orchestration_result["decision"] == "AUTO_RESOLVE"
            else TicketStatus.ESCALATED
        )

        # --------------------------------------------------
        # Initialize conversation messages
        # --------------------------------------------------
        messages = [
            {
                "sender": "customer",
                "content": query,
                "timestamp": datetime.utcnow(),
            }
        ]

        if orchestration_result.get("final_response"):
            messages.append({
                "sender": "ai",
                "content": orchestration_result["final_response"],
                "timestamp": datetime.utcnow(),
            })

        # --------------------------------------------------
        # Build Ticket document
        # --------------------------------------------------
        data = Ticket(
            ticket_id=ticket_id,
            user_id=user_id,

            messages=messages,

            confidence_score=orchestration_result.get("confidence_score"),

            decision=orchestration_result["decision"],
            decision_reason=orchestration_result["decision_reason"],

            status=status,

            created_at=datetime.utcnow(),
            resolved_at=(
                datetime.utcnow()
                if status == TicketStatus.AI_RESOLVED
                else None
            )
        )

        try:
            self.collection.insert_one(data.model_dump())
        except Exception as e:
            raise RuntimeError("Ticket creation failed") from e

        return TicketResponse(
            ticket_id=data.ticket_id,
            user_id=data.user_id,
            status=data.status,
            messages=data.messages,
            confidence_score=data.confidence_score,
            created_at=data.created_at,
            resolved_at=data.resolved_at
        )

    # --------------------------------------------------
    # Get Ticket by ID
    # --------------------------------------------------
    def get_ticket_by_id(self, ticket_id: str) -> Optional[dict]:
        return self.collection.find_one(
            {"ticket_id": ticket_id},
            {"_id": 0}
        )

    # --------------------------------------------------
    # List All Tickets (LATEST FIRST)
    # --------------------------------------------------
    def list_tickets(self) -> List[dict]:
        return list(
            self.collection
            .find({}, {"_id": 0})
            .sort("created_at", -1)
        )

    # --------------------------------------------------
    # Update Ticket Status
    # --------------------------------------------------
    def update_ticket_status(
        self,
        ticket_id: str,
        status: TicketStatus
    ) -> bool:
        result = self.collection.update_one(
            {"ticket_id": ticket_id},
            {
                "$set": {
                    "status": status,
                    "resolved_at": (
                        datetime.utcnow()
                        if status in {
                            TicketStatus.CLOSED,
                            TicketStatus.AI_RESOLVED,
                            TicketStatus.RESOLVED,
                        }
                        else None
                    )
                }
            }
        )
        return result.matched_count == 1



    # --------------------------------------------------
    # Append Message to Ticket (Agent / Customer)
    # --------------------------------------------------
    def append_message(self, ticket_id: str, message: dict) -> Optional[dict]:
        result = self.collection.update_one(
            {"ticket_id": ticket_id},
            {
                "$push": {"messages": message}
            }
        )

        if result.matched_count != 1:
            return None

        return self.get_ticket_by_id(ticket_id)
