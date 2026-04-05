import json
import faiss
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

from app.core.rag.embedder import Embedder


# -------------------------------------------------------------------
# Resolve project root safely (works from anywhere)
# backend/app/core/rag/retriever.py -> project root
# -------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]
FAISS_DIR = PROJECT_ROOT / "data" / "faiss_index"

print(f"[RETRIEVER] FAISS path: {FAISS_DIR}")
print(f"[RETRIEVER] index exists: {(FAISS_DIR / 'index.bin').exists()}")

class Retriever:
    """
    Retrieves relevant FAQs from the FAISS index based on semantic similarity.

    HARDENED:
    - Never crashes orchestration
    - Any failure → returns []
    """

    def __init__(self, top_k: int = 5):
        self.top_k = top_k

        self.index_path = FAISS_DIR / "index.bin"
        self.metadata_path = FAISS_DIR / "metadata.json"

        # --------------------------------------------------
        # Safe initialization
        # --------------------------------------------------
        try:
            if not self.index_path.exists():
                raise FileNotFoundError(
                    f"FAISS index file not found at {self.index_path}"
                )

            if not self.metadata_path.exists():
                raise FileNotFoundError(
                    f"FAISS metadata file not found at {self.metadata_path}"
                )

            self.embedder = Embedder()
            self.index = faiss.read_index(str(self.index_path))

            with open(self.metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

        except Exception:
            # HARD FAIL → SAFE MODE
            self.embedder = None
            self.index = None
            self.metadata = []

    def retrieve(self, query: str) -> List[Dict[str, Any]]:
        """
        Retrieve top-K relevant FAQs for a user query.

        Args:
            query (str): User question

        Returns:
            List[Dict]: List of FAQ objects (original text, not vectors)

        FAIL-SAFE:
        - Any error returns []
        """

        # --------------------------------------------------
        # Guard clauses
        # --------------------------------------------------
        if not query or not query.strip():
            return []

        if self.embedder is None or self.index is None:
            return []

        try:
            # --------------------------------------------------
            # Embed query
            # --------------------------------------------------
            query_embedding = self.embedder.embed_query(query)

            # ✅ CRITICAL: Normalize query vector to match index
            # This ensures Dot Product acts as Cosine Similarity
            norm = np.linalg.norm(query_embedding)
            if norm > 0:
                query_embedding = query_embedding / norm

            query_embedding = np.expand_dims(query_embedding, axis=0)

            # --------------------------------------------------
            # Vector search
            # --------------------------------------------------
            # 🔥 DEBUG: Capture scores and print them
            scores, indices = self.index.search(query_embedding, self.top_k)

            print("RETRIEVAL SCORES:", scores)
            print("RETRIEVAL INDICES:", indices)

            results: List[Dict[str, Any]] = []

            for idx in indices[0]:
                if (
                    isinstance(idx, (int, np.integer))
                    and 0 <= idx < len(self.metadata)
                ):
                    item = self.metadata[idx]
                    if isinstance(item, dict):
                        results.append(item)

            return results

        except Exception:
            # Any runtime failure → safe fallback
            return []