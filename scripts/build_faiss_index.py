# File: backend/scripts/build_faiss_index.py

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from app.db.mongo import faq_collection

# -------------------------------------------------------
# Config
# -------------------------------------------------------
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./data/faiss_index/index.bin")
METADATA_PATH = FAISS_INDEX_PATH.replace("index.bin", "metadata.json")

# -------------------------------------------------------
# Load all knowledge sources
# -------------------------------------------------------
def load_knowledge_base():
    entries = []

    # 1. From MongoDB FAQs
    mongo_faqs = list(faq_collection.find({}, {"_id": 0, "question": 1, "answer": 1, "category": 1}))
    for faq in mongo_faqs:
        entries.append({
            "question": faq["question"],
            "answer": faq["answer"],
            "category": faq.get("category", "general"),
            "source": "mongodb"
        })
    print(f"  ✅ Loaded {len(mongo_faqs)} FAQs from MongoDB")

    # 2. From order_tracking.json
    order_path = os.path.join(os.path.dirname(__file__), "../data/knowledge_base/order_tracking.json")
    if os.path.exists(order_path):
        with open(order_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    entries.append({**item, "source": "order_tracking"})
            else:
                entries.append({**data, "source": "order_tracking"})
        print(f"  ✅ Loaded order_tracking.json")

    # 3. From refunds.json
    refunds_path = os.path.join(os.path.dirname(__file__), "../data/knowledge_base/refunds.json")
    if os.path.exists(refunds_path):
        with open(refunds_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    entries.append({**item, "source": "refunds"})
            else:
                entries.append({**data, "source": "refunds"})
        print(f"  ✅ Loaded refunds.json")

    # 4. From payments.json
    payments_path = os.path.join(os.path.dirname(__file__), "../data/knowledge_base/payments.json")
    if os.path.exists(payments_path):
        with open(payments_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    entries.append({**item, "source": "payments"})
            else:
                entries.append({**data, "source": "payments"})
        print(f"  ✅ Loaded payments.json")

    return entries


# -------------------------------------------------------
# Build FAISS index
# -------------------------------------------------------
def build_index():
    print("\n🔧 Building FAISS index...")

    entries = load_knowledge_base()
    if not entries:
        print("❌ No data found. Run insert_faqs.py first.")
        return

    print(f"\n📚 Total entries to index: {len(entries)}")

    # Load embedding model
    print(f"🤖 Loading embedding model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)

    # Extract questions for embedding
    questions = [entry["question"] for entry in entries]
    
    print("⚙️  Generating embeddings...")
    embeddings = model.encode(questions, show_progress_bar=True)
    
    # Normalize embeddings for cosine similarity via dot product
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
    
    # Get embedding dimension
    dimension = embeddings.shape[1]
    print(f"📐 Embedding dimension: {dimension}")

    # Create FAISS index (Inner Product = Cosine Similarity after normalization)
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings.astype('float32'))
    
    print(f"✅ Added {index.ntotal} vectors to FAISS index")

    # Save index
    os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
    faiss.write_index(index, FAISS_INDEX_PATH)
    print(f"✅ FAISS index saved → {FAISS_INDEX_PATH}")

    # Save metadata
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
    print(f"✅ Metadata saved → {METADATA_PATH}")

    print(f"\n🎉 Done! Indexed {len(entries)} entries.")


# -------------------------------------------------------
# Main
# -------------------------------------------------------
if __name__ == "__main__":
    build_index()