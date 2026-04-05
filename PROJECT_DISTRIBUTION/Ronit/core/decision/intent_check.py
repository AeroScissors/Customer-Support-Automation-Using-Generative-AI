# backend/app/core/decision/intent_check.py

from typing import Dict, Tuple


# Predefined risk keywords by category
RISK_KEYWORDS = {
    "LEGAL": [
        "sue", "legal notice", "consumer court", "lawsuit",
        "court case", "legal action"
    ],
    "FINANCIAL_DISPUTE": [
        "chargeback", "bank dispute", "payment dispute",
        "refund fraud"
    ],
    "ABUSE": [
        "idiot", "stupid", "fraud", "scam",
        "cheat", "thief"
    ]
}


def check_intent(user_query: str) -> Tuple[bool, str]:
    """
    Low-level intent check.
    Returns:
        (is_safe, reason)
    """
    text = user_query.lower()

    for category, keywords in RISK_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                return (
                    False,
                    f"Unsafe intent detected: {category}"
                )

    return True, "Intent is safe"


# --------------------------------------------------
# Orchestration-facing wrapper (STABLE CONTRACT)
# --------------------------------------------------
def check_intent_risk(user_query: str) -> Dict[str, str]:
    """
    Adapter used by orchestration pipeline.

    Returns:
        {
            "is_risky": bool,
            "reason": str
        }
    """
    is_safe, reason = check_intent(user_query)

    return {
        "is_risky": not is_safe,
        "reason": reason
    }
