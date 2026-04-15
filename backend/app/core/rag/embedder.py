# backend/app/core/rag/embedder.py

from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer


class Embedder:
    """
    Local embedder using sentence-transformers (all-MiniLM-L6-v2).
    Matches the model used to build the FAISS index.
    """

    MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

    def __init__(self):
        self.model = SentenceTransformer(self.MODEL_NAME)
        self.embedding_dim = 384  # fixed for all-MiniLM-L6-v2

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        if not texts:
            raise ValueError("Input text list is empty")
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return np.array(embeddings, dtype=np.float32)

    def embed_query(self, query: str) -> np.ndarray:
        if not query or not query.strip():
            raise ValueError("Query is empty")
        embedding = self.model.encode([query], show_progress_bar=False)[0]
        return np.array(embedding, dtype=np.float32)