from typing import Dict

from app.core.orchestration import orchestrate_query
from app.services.ticket_service import TicketService


class ChatService:
    """
    ChatService is the ONLY bridge between:
    - API layer
    - Core AI orchestration
    - Ticket persistence

    It contains NO AI logic and NO database logic.
    """

    def __init__(self):
        self.ticket_service = TicketService()

    # --------------------------------------------------
    # Handle User Query (PRIMARY ENTRY POINT)
    # --------------------------------------------------
    def handle_user_query(
        self,
        query: str,
        user_id: str = "anonymous_user"
    ) -> Dict:
        """
        Full lifecycle handler for a customer query.

        Flow:
        API → ChatService → Orchestration → TicketService → API
        """

        # -----------------------------
        # 1️⃣ Run AI Orchestration
        # -----------------------------
        orchestration_result = orchestrate_query(query)

        # -----------------------------
        # 2️⃣ Create Ticket (MANDATORY)
        # -----------------------------
        ticket = self.ticket_service.create_ticket(
            user_id=user_id,
            query=query,
            orchestration_result=orchestration_result
        )

        # -----------------------------
        # 3️⃣ API-Safe Response
        # -----------------------------
        return {
            "ticket_id": ticket.ticket_id,
            "decision": ticket.status,
            "response": ticket.ai_response,
            "confidence_score": ticket.confidence_score,
            "created_at": ticket.created_at,
        }
