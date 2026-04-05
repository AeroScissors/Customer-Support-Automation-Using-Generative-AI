from typing import Dict


def make_decision(
    confidence_score: float,
    intent_result: Dict[str, str],
    emotion_result: Dict[str, str],
) -> Dict[str, str]:
    """
    Final decision engine.

    Determines whether the system should:
    - AUTO_RESOLVE
    - ESCALATE_TO_HUMAN
    """

    # --------------------------------------------------
    # 1️⃣ Unsafe intent → escalate immediately
    # ✅ FIX: check_intent_risk returns "is_risky", not "is_safe"
    # --------------------------------------------------
    if intent_result.get("is_risky", False):
        return {
            "decision": "ESCALATE_TO_HUMAN",
            "reason": intent_result.get("reason", "Unsafe intent detected")
        }

    # --------------------------------------------------
    # 2️⃣ Emotional escalation → escalate
    # --------------------------------------------------
    if emotion_result.get("is_escalated", False):
        return {
            "decision": "ESCALATE_TO_HUMAN",
            "reason": f"User emotion escalated: {emotion_result.get('emotion')}"
        }

    # --------------------------------------------------
    # 3️⃣ Low confidence → escalate
    # --------------------------------------------------
    if confidence_score < 0.5:
        return {
            "decision": "ESCALATE_TO_HUMAN",
            "reason": "Low confidence in AI response"
        }

    # --------------------------------------------------
    # 4️⃣ Otherwise → auto resolve
    # --------------------------------------------------
    return {
        "decision": "AUTO_RESOLVE",
        "reason": "Safe intent, calm emotion, high confidence"
    }