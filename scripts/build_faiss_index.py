import sys
from pathlib import Path
import os
import json
import faiss
import numpy as np

# Add project root to PYTHONPATH
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

# Imports (Now including Mongo)
from backend.app.core.rag.embedder import Embedder
from backend.app.db.mongo import faq_collection

# Paths
FAISS_INDEX_DIR = Path("data/faiss_index")
FAISS_INDEX_PATH = FAISS_INDEX_DIR / "index.bin"
METADATA_PATH = FAISS_INDEX_DIR / "metadata.json"


def load_faqs():
    """
    Load all FAQs directly from MongoDB.
    """
    print("Fetching FAQs from MongoDB...")
    faqs_cursor = faq_collection.find({})
    faqs = []

    for faq in faqs_cursor:
        faqs.append({
            "question": faq.get("question"),
            "answer": faq.get("answer"),
            "category": faq.get("category", "General"),
        })

    return faqs


def build_index():
    print("Loading FAQs...")
    faqs = load_faqs()

    if not faqs:
        print("Warning: No FAQs found in database.")
        return

    texts = [
        f"Q: {faq['question']} A: {faq['answer']}"
        for faq in faqs
    ]

    print(f"Embedding {len(texts)} FAQs...")
    embedder = Embedder()
    embeddings = embedder.embed_texts(texts)

    # ✅ Normalize for cosine similarity
    # IndexFlatIP calculates Dot Product. If vectors are normalized (unit length),
    # Dot Product == Cosine Similarity.
    print("Normalizing embeddings for Cosine Similarity...")
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

    dimension = embeddings.shape[1]

    print("Creating FAISS index...")
    # IndexFlatIP is faster and exact for Inner Product
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)

    print("Saving index and metadata...")
    FAISS_INDEX_DIR.mkdir(parents=True, exist_ok=True)

    faiss.write_index(index, str(FAISS_INDEX_PATH))

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(faqs, f, indent=2)

    print("FAISS index built successfully")
    print(f"Total vectors indexed: {index.ntotal}")
    print(f"Embedding dimension: {dimension}")


if __name__ == "__main__":
    build_index()