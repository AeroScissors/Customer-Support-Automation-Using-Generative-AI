from typing import List, Any


def _extract_text(item: Any) -> str:
    """
    Safely extract text from retrieved context items.
    """
    if isinstance(item, str):
        return item

    if isinstance(item, dict):
        for value in item.values():
            if isinstance(value, str):
                return value
        return str(item)

    return str(item)


def compute_confidence(
    query: str,
    retrieved_context: List[Any]
) -> float:
    """
    Computes a confidence score (0.0 - 1.0) based on
    how well the retrieved context supports the user query.
    """

    # 1️⃣ No context → almost zero confidence
    if not retrieved_context:
        return 0.05

    # Normalize context safely
    context_text = " ".join(
        _extract_text(item) for item in retrieved_context
    ).lower()

    query_tokens = set(query.lower().split())

    # Count keyword overlap
    matches = sum(
        1 for token in query_tokens if token in context_text
    )

    confidence = min(0.95, 0.2 + (matches * 0.15))

    return round(confidence, 2)
