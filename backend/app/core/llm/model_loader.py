# backend/app/core/llm/model_loader.py

import os
import requests
from typing import Optional


class OllamaModelLoader:
    """
    Singleton-style loader for Ollama LLMs.

    Responsibilities:
    - Verify Ollama is running
    - Store model configuration
    - Provide a reusable interface for generation calls

    This class DOES NOT:
    - Handle prompts
    - Handle RAG
    - Generate responses directly
    """

    _instance: Optional["OllamaModelLoader"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OllamaModelLoader, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = os.getenv("LLM_MODEL_NAME", "mistral")

        self._health_check()

    def _health_check(self):
        """
        Ensures Ollama is running and reachable.
        Fails fast if Ollama is not available.
        """
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code != 200:
                raise RuntimeError("Ollama is not responding correctly.")
        except requests.exceptions.RequestException as exc:
            raise RuntimeError(
                "Ollama is not running or not reachable at "
                f"{self.base_url}. Start Ollama before running the backend."
            ) from exc

    def get_model_name(self) -> str:
        """
        Returns the configured model name.
        """
        return self.model_name

    def get_base_url(self) -> str:
        """
        Returns the Ollama base URL.
        """
        return self.base_url


# Global, shared instance
llm_loader = OllamaModelLoader()
