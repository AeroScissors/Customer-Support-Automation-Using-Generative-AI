from typing import Dict, Any, List
import traceback

from app.core.rag.retriever import Retriever
from app.core.llm.generation import generate_response
from app.core.decision.confidence import compute_confidence
from app.core.decision.intent_check import check_intent_risk
from app.core.decision.emotion_check import check_emotional_state
from app.core.decision.decision_engine import make_decision


def _extract_text(item: Any) -> str:
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        for value in item.values():
            if isinstance(value, str):
                return value
        return str(item)
    return str(item)


def orchestrate_query(query: str) -> Dict[str, Any]:

    # 1️⃣ RAG Retrieval
    try:
        retriever = Retriever()
        retrieved_context: List[Any] = retriever.retrieve(query)
        print(f"[ORCH] Retrieved {len(retrieved_context)} context items")
    except Exception as e:
        print(f"[ORCH] RAG failed: {e}")
        retrieved_context = []

    # 2️⃣ Normalize Context
    normalized_context: List[str] = []
    for item in retrieved_context:
        if isinstance(item, dict):
            question = item.get("question", "")
            answer = item.get("answer", "")
            normalized_context.append(f"Q: {question}\nA: {answer}")
        else:
            normalized_context.append(str(item))

    try:
        # 3️⃣ LLM Generation
        print(f"[ORCH] Calling LLM...")
        llm_response: str = generate_response(query=query, context=normalized_context)
        print(f"[ORCH] LLM response: {llm_response[:100]}")

        # 4️⃣ Confidence
        confidence_score: float = compute_confidence(query=query, retrieved_context=retrieved_context)
        print(f"[ORCH] Confidence score: {confidence_score}")

        # 5️⃣ Intent
        intent_result = check_intent_risk(query)
        print(f"[ORCH] Intent: {intent_result}")

        # 6️⃣ Emotion
        emotion_result = check_emotional_state(query)
        print(f"[ORCH] Emotion: {emotion_result}")

        # 7️⃣ Decision
        decision_result = make_decision(
            confidence_score=confidence_score,
            intent_result=intent_result,
            emotion_result=emotion_result
        )
        print(f"[ORCH] Decision: {decision_result}")

        # 8️⃣ Output
        final_response = (
            llm_response
            if decision_result["decision"] == "AUTO_RESOLVE"
            else None
        )

        return {
            "final_response": final_response,
            "confidence_score": confidence_score,
            "decision": decision_result["decision"],
            "decision_reason": decision_result["reason"],
            "retrieved_context": retrieved_context,
            "intent_analysis": intent_result,
            "emotion_analysis": emotion_result,
        }

    except Exception as e:
        print(f"[ORCH ERROR] {e}")
        traceback.print_exc()
        return {
            "final_response": None,
            "confidence_score": 0.0,
            "decision": "ESCALATE_TO_HUMAN",
            "decision_reason": "System error during processing",
            "retrieved_context": retrieved_context,
            "intent_analysis": {},
            "emotion_analysis": {},
        }