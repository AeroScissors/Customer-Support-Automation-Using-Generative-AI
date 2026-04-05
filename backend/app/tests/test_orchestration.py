from app.core.orchestration import orchestrate_query


def test_orchestration_pipeline():
    query = "My order is delayed"

    result = orchestrate_query(query)

    assert "final_response" in result
    assert "confidence_score" in result
    assert "decision" in result
    assert "decision_reason" in result
    assert "retrieved_context" in result

    assert isinstance(result["confidence_score"], float)
    assert result["decision"] in ["AUTO_RESOLVE", "ESCALATE_TO_HUMAN"]
