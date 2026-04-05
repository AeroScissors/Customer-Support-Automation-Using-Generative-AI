import os
import requests
import logging
from typing import List

from app.core.llm.model_loader import llm_loader
from app.core.llm.prompt_templates import build_system_prompt

logger = logging.getLogger(__name__)


class LLMGenerationError(Exception):
    pass


def generate_response(query: str, context: List[str]) -> str:
    if os.getenv("ENV", "dev") == "test":
        if context:
            return f"Based on our information: {context[0]}"
        return "I am looking into your issue."

    try:
        return _generate_with_llm(query, context)
    except Exception as e:
        logger.error(f"[LLM] Failure: {e}")
        print(f"[LLM ERROR] {e}")
        return "I'm unable to answer this right now. A support agent will assist you shortly."


def _generate_with_llm(user_query: str, context: List[str]) -> str:
    if not user_query or not user_query.strip():
        raise LLMGenerationError("User query must be non-empty.")

    system_prompt = build_system_prompt()
    context_block = "\n".join(context) if context else "NO RELEVANT CONTEXT PROVIDED."

    final_prompt = f"""
{system_prompt}

COMPANY CONTEXT:
{context_block}

USER QUESTION:
{user_query}

Answer the user question strictly using the company context above.
""".strip()

    provider = llm_loader.get_provider()

    if provider == "groq":
        return _call_groq(final_prompt, system_prompt)
    else:
        return _call_ollama(final_prompt)


def _call_groq(final_prompt: str, system_prompt: str) -> str:
    api_key = llm_loader.get_groq_api_key()
    model = llm_loader.get_model_name()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": final_prompt}
        ],
        "temperature": float(os.getenv("LLM_TEMPERATURE", 0.3)),
        "max_tokens": int(os.getenv("LLM_MAX_TOKENS", 512)),
    }

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
    except requests.exceptions.Timeout:
        raise LLMGenerationError("Groq request timed out.")
    except requests.exceptions.RequestException as e:
        raise LLMGenerationError(f"Groq request failed: {e}")

    if response.status_code != 200:
        raise LLMGenerationError(f"Groq returned HTTP {response.status_code}: {response.text}")

    data = response.json()
    text = data["choices"][0]["message"]["content"].strip()

    if not text:
        raise LLMGenerationError("Groq returned empty response.")

    return text


def _call_ollama(final_prompt: str) -> str:
    base_url = llm_loader.get_base_url()
    model = llm_loader.get_model_name()

    payload = {
        "model": model,
        "prompt": final_prompt,
        "stream": False,
        "options": {
            "temperature": float(os.getenv("LLM_TEMPERATURE", 0.3)),
            "top_p": float(os.getenv("LLM_TOP_P", 0.9)),
            "num_predict": int(os.getenv("LLM_MAX_TOKENS", 512)),
        }
    }

    try:
        response = requests.post(
            f"{base_url}/api/generate",
            json=payload,
            timeout=300
        )
    except requests.exceptions.Timeout:
        raise LLMGenerationError("Ollama timed out.")
    except requests.exceptions.RequestException as e:
        raise LLMGenerationError(f"Ollama request failed: {e}")

    if response.status_code != 200:
        raise LLMGenerationError(f"Ollama returned HTTP {response.status_code}: {response.text}")

    text = response.json().get("response", "").strip()
    if not text:
        raise LLMGenerationError("Ollama returned empty response.")

    return text