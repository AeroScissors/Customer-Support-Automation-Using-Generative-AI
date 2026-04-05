from app.services.ticket_service import TicketService


def test_ticket_creation():
    service = TicketService()

    orchestration_result = {
        "final_response": "Your order is on the way",
        "confidence_score": 0.91,
        "decision": "AUTO_RESOLVE",
        "decision_reason": "High confidence and safe intent"
    }

    ticket = service.create_ticket(
        user_id="test_user",
        query="Where is my order?",
        orchestration_result=orchestration_result
    )

    assert ticket.ticket_id is not None
    assert ticket.status.value == "AI_RESOLVED"
    assert ticket.ai_response is not None
    assert ticket.confidence_score == 0.91
