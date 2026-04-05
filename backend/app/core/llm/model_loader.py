import os
import requests
from typing import Optional


class LLMLoader:
    _instance: Optional["LLMLoader"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LLMLoader, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.provider = os.getenv("LLM_PROVIDER", "ollama").lower()
        self.model_name = os.getenv("LLM_MODEL_NAME", "mistral")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")

        if self.provider == "ollama":
            self._health_check_ollama()
        elif self.provider == "groq":
            if not self.groq_api_key:
                raise RuntimeError("GROQ_API_KEY is missing in .env")
            print(f"[LLM] Using Groq with model '{self.model_name}'")
        else:
            raise RuntimeError(f"Unknown LLM_PROVIDER: {self.provider}")

    def _health_check_ollama(self):
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code != 200:
                raise RuntimeError("Ollama is not responding correctly.")
        except requests.exceptions.RequestException as exc:
            raise RuntimeError(
                f"Ollama not reachable at {self.base_url}. Run `ollama serve`."
            ) from exc

    def get_provider(self) -> str:
        return self.provider

    def get_model_name(self) -> str:
        return self.model_name

    def get_base_url(self) -> str:
        return self.base_url

    def get_groq_api_key(self) -> str:
        return self.groq_api_key


llm_loader = LLMLoader()