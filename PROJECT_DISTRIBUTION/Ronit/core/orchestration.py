from typing import Dict, Any, List

# RAG
from app.core.rag.retriever import Retriever

# LLM
from app.core.llm.generation import generate_response

# Decision & safety
from app.core.decision.confidence import compute_confidence
from app.core.decision.intent_check import check_intent_risk
from app.core.decision.emotion_check import check_emotional_state
from app.core.decision.decision_engine import make_decision


# -------------------------------------------------
# Internal helpers
# -------------------------------------------------
def _extract_text(item: Any) -> str:
    """
    Safely extract text from retriever output.

    Supports:
    - str
    - dict (first string value)
    - fallback to str(item)
    """
    if isinstance(item, str):
        return item

    if isinstance(item, dict):
        for value in item.values():
            if isinstance(value, str):
                return value
        return str(item)

    return str(item)


# -------------------------------------------------
# CENTRAL ORCHESTRATION PIPELINE
# -------------------------------------------------
def orchestrate_query(query: str) -> Dict[str, Any]:
    """
    CENTRAL ORCHESTRATION PIPELINE

    This function defines the ONLY allowed flow
    for processing a customer query.

    Order of execution is STRICT and NON-NEGOTIABLE.

    HARDENED:
    - Never crashes
    - Any failure results in safe escalation
    """

    # -------------------------------------------------
    # 1️⃣ Context Retrieval (RAG) — SAFE
    # -------------------------------------------------
    try:
        retriever = Retriever()
        retrieved_context: List[Any] = retriever.retrieve(query)
    except Exception:
        retrieved_context = []

    # -------------------------------------------------
    # 2️⃣ Normalize Context for LLM
    # -------------------------------------------------
    normalized_context: List[str] = []

    for item in retrieved_context:
        if isinstance(item, dict):
            # 🔥 FIX: Explicitly format Q&A structure for LLM
            question = item.get("question", "")
            answer = item.get("answer", "")
            combined = f"Q: {question}\nA: {answer}"
            normalized_context.append(combined)
        else:
            normalized_context.append(str(item))

    try:
        # -------------------------------------------------
        # 3️⃣ LLM Response Generation
        # -------------------------------------------------
        llm_response: str = generate_response(
            query=query,
            context=normalized_context
        )

        # -------------------------------------------------
        # 4️⃣ Confidence Scoring
        # -------------------------------------------------
        confidence_score: float = compute_confidence(
            query=query,
            retrieved_context=retrieved_context
        )

        # -------------------------------------------------
        # 5️⃣ Intent Risk Check
        # -------------------------------------------------
        intent_result = check_intent_risk(query)

        # -------------------------------------------------
        # 6️⃣ Emotion Escalation Check
        # -------------------------------------------------
        emotion_result = check_emotional_state(query)

        # -------------------------------------------------
        # 7️⃣ Final Decision Engine
        # -------------------------------------------------
        decision_result = make_decision(
            confidence_score=confidence_score,
            intent_result=intent_result,
            emotion_result=emotion_result
        )

        # -------------------------------------------------
        # 8️⃣ Structured Output (Single Source of Truth)
        # -------------------------------------------------
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

    # -------------------------------------------------
    # 🚨 HARD FAILURE FALLBACK
    # -------------------------------------------------
    except Exception:
        return {
            "final_response": None,
            "confidence_score": 0.0,
            "decision": "ESCALATE_TO_HUMAN",
            "decision_reason": "System error during processing",
            "retrieved_context": retrieved_context,
            "intent_analysis": {},
            "emotion_analysis": {},
        }