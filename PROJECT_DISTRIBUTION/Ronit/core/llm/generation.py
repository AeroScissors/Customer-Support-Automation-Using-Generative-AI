import os
import requests
from typing import List

from app.core.llm.model_loader import llm_loader
from app.core.llm.prompt_templates import build_system_prompt


class LLMGenerationError(Exception):
    """Raised when text generation fails."""
    pass


# --------------------------------------------------
# PUBLIC API (USED BY ORCHESTRATION)
# --------------------------------------------------
def generate_response(
    query: str,
    context: List[str]
) -> str:
    """
    Generates a response using LLM given user query and retrieved context.

    HARDENED:
    - Test-safe (no external calls)
    - Production-safe (never crashes orchestration)
    - Deterministic fallback on failure
    """

    # ---------------------------------------------
    # 🧪 TEST MODE (CRITICAL)
    # ---------------------------------------------
    if os.getenv("ENV", "dev") == "test":
        # Deterministic, fast, no external calls
        if context:
            return f"Based on our information: {context[0]}"
        return "I am looking into your issue."

    # ---------------------------------------------
    # 🚀 PRODUCTION MODE (SAFE WRAPPER)
    # ---------------------------------------------
    try:
        return _generate_with_llm(query, context)
    except Exception:
        # HARD FAIL → SAFE RESPONSE
        return (
            "I’m unable to answer this right now. "
            "A support agent will assist you shortly."
        )


# --------------------------------------------------
# INTERNAL LLM CALL (NOT USED IN TESTS)
# --------------------------------------------------
def _generate_with_llm(
    user_query: str,
    context: List[str]
) -> str:
    """
    Actual LLM invocation logic.

    INTERNAL ONLY:
    - May raise exceptions
    - Wrapped safely by generate_response
    """

    if not user_query or not user_query.strip():
        raise ValueError("User query must be a non-empty string.")

    # --------------------------------------------------
    # Build prompt
    # --------------------------------------------------
    system_prompt = build_system_prompt()
    context_block = (
        "\n".join(context)
        if context
        else "NO RELEVANT CONTEXT PROVIDED."
    )

    final_prompt = f"""
{system_prompt}

COMPANY CONTEXT:
{context_block}

USER QUESTION:
{user_query}

INSTRUCTIONS:
Answer the user question strictly using the company context above.
""".strip()

    # --------------------------------------------------
    # Ollama request payload
    # --------------------------------------------------
    payload = {
        "model": llm_loader.get_model_name(),
        "prompt": final_prompt,
        "options": {
            "temperature": float(os.getenv("LLM_TEMPERATURE", 0.3)),
            "top_p": float(os.getenv("LLM_TOP_P", 0.9)),
            "num_predict": int(os.getenv("LLM_MAX_TOKENS", 512)),
        },
        "stream": False
    }

    # --------------------------------------------------
    # Call Ollama (TIMEOUT PROTECTED)
    # --------------------------------------------------
    try:
        response = requests.post(
            f"{llm_loader.get_base_url()}/api/generate",
            json=payload,
            timeout=60
        )
    except requests.exceptions.RequestException as exc:
        raise LLMGenerationError("Failed to connect to Ollama.") from exc

    if response.status_code != 200:
        raise LLMGenerationError(
            f"Ollama generation failed: {response.text}"
        )

    data = response.json()
    generated_text = data.get("response", "").strip()

    if not generated_text:
        raise LLMGenerationError("LLM returned an empty response.")

    # --------------------------------------------------
    # HARD REFUSAL ENFORCEMENT (CRITICAL)
    # --------------------------------------------------
    REFUSAL_TEXT = "I do not have enough information to answer this question."

    if REFUSAL_TEXT in generated_text:
        return REFUSAL_TEXT

    return generated_text
