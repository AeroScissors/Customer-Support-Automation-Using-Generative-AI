# backend/app/core/decision/emotion_check.py

from typing import Dict, Tuple


# ✅ FIX: Expanded keyword lists to cover real-world cases
EMOTION_KEYWORDS = {
    "ANGRY": [
        "angry", "furious", "mad", "irritated",
        "annoyed", "frustrated", "very angry",
        "so angry", "unacceptable", "ridiculous",
        "disgusting", "outraged", "livid"
    ],
    "DISTRESSED": [
        "upset", "worried", "anxious",
        "scared", "panic", "stressed",
        "desperate", "please help", "urgent",
        "immediately", "right now", "as soon as possible"
    ],
    "ABUSIVE": [
        "idiot", "stupid", "hate you",
        "worst service", "terrible", "useless",
        "incompetent", "pathetic"
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