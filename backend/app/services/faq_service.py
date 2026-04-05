import sys
import os
import json
import re
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from bson import ObjectId
from app.db.mongo import faq_collection

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

try:
    from scripts.build_faiss_index import build_index as rebuild_index
except ImportError:
    def rebuild_index():
        print("⚠️ Warning: scripts/build_faiss_index.py not found. AI Index not updated.")


def get_all_faqs() -> List[Dict]:
    faqs = faq_collection.find({})
    results = []
    for faq in faqs:
        # ✅ FIX: Fall back to created_at if updated_at missing
        date = faq.get("updated_at") or faq.get("created_at")
        results.append({
            "faq_id": str(faq["_id"]),
            "question": faq.get("question"),
            "answer": faq.get("answer"),
            "category": faq.get("category", "general"),
            "created_at": date,   # ✅ expose as created_at so frontend finds it
            "updated_at": date,
        })
    return results


def add_faq(question: str, answer: str, category: str = "General") -> None:
    faq_collection.insert_one({
        "question": question,
        "answer": answer,
        "category": category,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    BASE_DIR = Path(__file__).resolve().parents[3]
    kb_path = BASE_DIR / "data" / "knowledge_base"
    kb_path.mkdir(parents=True, exist_ok=True)

    safe_name = re.sub(r'[^a-zA-Z0-9 ]', '', question)
    safe_name = safe_name.replace(" ", "_")[:50]
    file_path = kb_path / f"{safe_name}.json"

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump({"question": question, "answer": answer, "category": category}, f, indent=2)

    print(f"✅ FAQ saved to {file_path}. Rebuilding index...")
    rebuild_index()


def update_faq(faq_id: str, question: Optional[str] = None, answer: Optional[str] = None) -> None:
    update_fields = {"updated_at": datetime.utcnow()}
    if question is not None:
        update_fields["question"] = question
    if answer is not None:
        update_fields["answer"] = answer

    result = faq_collection.find_one_and_update(
        {"_id": ObjectId(faq_id)},
        {"$set": update_fields},
    )
    if not result:
        raise ValueError("FAQ not found")
    rebuild_index()


def delete_faq(faq_id: str) -> None:
    result = faq_collection.delete_one({"_id": ObjectId(faq_id)})
    if result.deleted_count == 0:
        raise ValueError("FAQ not found")
    rebuild_index()


def _to_object_id(faq_id: str):
    return ObjectId(faq_id)