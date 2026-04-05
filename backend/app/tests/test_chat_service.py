from app.services.chat_service import ChatService


def test_chat_service_flow():
    service = ChatService()

    response = service.handle_user_query(
        query="I want a refund",
        user_id="test_user"
    )

    assert "ticket_id" in response
    assert "decision" in response
    assert "confidence_score" in response
    assert "response" in response
