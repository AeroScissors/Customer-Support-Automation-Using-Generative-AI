from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer


class Embedder:
    """
    Responsible only for converting text into embeddings.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Load the embedding model once during initialization.
        """
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """
        Convert a list of texts into embeddings.

        Args:
            texts (List[str]): List of input strings

        Returns:
            np.ndarray: 2D array of shape (num_texts, embedding_dim)
        """
        if not texts:
            raise ValueError("Input text list is empty")

        embeddings = self.model.encode(
            texts,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        return embeddings

    def embed_query(self, query: str) -> np.ndarray:
        """
        Convert a single query string into an embedding.

        Args:
            query (str): User query

        Returns:
            np.ndarray: 1D embedding vector
        """
        if not query or not query.strip():
            raise ValueError("Query text is empty")

        embedding = self.model.encode(
            query,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        return embedding
