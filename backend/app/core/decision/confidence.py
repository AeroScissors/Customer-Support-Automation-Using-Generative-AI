from typing import List, Any

STOPWORDS = {"how", "do", "i", "my", "the", "a", "an", "is", "it", "to", "can", "you", "me", "we", "our", "your"}

def _extract_text(item: Any) -> str:
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        for value in item.values():
            if isinstance(value, str):
                return value
        return str(item)
    return str(item)


def compute_confidence(query: str, retrieved_context: List[Any]) -> float:
    if not retrieved_context:
        return 0.05

    context_text = " ".join(
        _extract_text(item) for item in retrieved_context
    ).lower()

    # Filter out stopwords before matching
    query_tokens = set(query.lower().split()) - STOPWORDS

    if not query_tokens:
        return 0.5

    matches = sum(1 for token in query_tokens if token in context_text)
    ratio = matches / len(query_tokens)
    confidence = min(0.95, 0.4 + (ratio * 0.55))

    return round(confidence, 2)