# File: backend/scripts/build_faiss_index.py

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from app.db.mongo import faq_collection

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./data/faiss_index/index.bin")
METADATA_PATH = FAISS_INDEX_PATH.replace("index.bin", "metadata.json")

def load_knowledge_base():
    entries = []

    mongo_faqs = list(faq_collection.find({}, {"_id": 0, "question": 1, "answer": 1, "category": 1}))
    for faq in mongo_faqs:
        entries.append({
            "question": faq["question"],
            "answer": faq["answer"],
            "category": faq.get("category", "general"),
            "source": "mongodb"
        })
    print(f"  ✅ Loaded {len(mongo_faqs)} FAQs from MongoDB")

    base = os.path.join(os.path.dirname(__file__), "../data/knowledge_base")

    for filename in ["order_tracking.json", "refunds.json", "payments.json"]:
        path = os.path.join(base, filename)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    entries.append({**item, "source": filename})
            else:
                entries.append({**data, "source": filename})
            print(f"  ✅ Loaded {filename}")

    return entries


def build_index():
    print("\n🔧 Building FAISS index...")
    entries = load_knowledge_base()

    if not entries:
        print("❌ No data found. Run insert_faqs.py first.")
        return

    print(f"\n📚 Total entries: {len(entries)}")
    print(f"🤖 Loading embedding model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)

    texts = [f"{e['question']} {e['answer']}" for e in entries]

    print("⚙️  Generating embeddings...")
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    embeddings = embeddings.astype(np.float32)

    faiss.normalize_L2(embeddings)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
    faiss.write_index(index, FAISS_INDEX_PATH)
    print(f"✅ FAISS index saved → {FAISS_INDEX_PATH}")

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2, default=str)
    print(f"✅ Metadata saved → {METADATA_PATH}")

    print(f"\n🎉 Done! Indexed {len(entries)} entries.")


if __name__ == "__main__":
    build_index()