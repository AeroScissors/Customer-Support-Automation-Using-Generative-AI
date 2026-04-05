# backend/app/core/decision/emotion_check.py

from typing import Dict, Tuple


# Simple keyword-based emotion detection
EMOTION_KEYWORDS = {
    "ANGRY": [
        "angry", "furious", "mad", "irritated",
        "annoyed", "frustrated"
    ],
    "DISTRESSED": [
        "upset", "worried", "anxious",
        "scared", "panic"
    ],
    "ABUSIVE": [
        "idiot", "stupid", "hate you",
        "worst service"
    ]
}


def check_emotion(user_query: str) -> Tuple[bool, str]:
    """
    Low-level emotion detection.

    Returns:
        (is_escalated, emotion_label)
    """
    text = user_query.lower()

    for emotion, keywords in EMOTION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                return True, emotion

    return False, "CALM"


# --------------------------------------------------
# Orchestration-facing wrapper (STABLE CONTRACT)
# --------------------------------------------------
def check_emotional_state(user_query: str) -> Dict[str, str]:
    """
    Adapter used by orchestration pipeline.

    Returns:
        {
            "is_escalated": bool,
            "emotion": str
        }
    """
    is_escalated, emotion = check_emotion(user_query)

    return {
        "is_escalated": is_escalated,
        "emotion": emotion
    }
