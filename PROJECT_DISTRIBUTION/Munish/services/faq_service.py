import sys
import os
import json
import re
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from bson import ObjectId
from app.db.mongo import faq_collection

# -------------------------------------------------------------------------
# Dynamic Path Fix: Allows backend to find scripts at project root
# -------------------------------------------------------------------------
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

try:
    from scripts.build_faiss_index import build_index as rebuild_index
except ImportError:
    # Fallback to prevent crash if script is moved or renamed
    def rebuild_index():
        print("⚠️ Warning: scripts/build_faiss_index.py not found. AI Index not updated.")

# -------------------------------------------------
# Fetch all FAQs
# -------------------------------------------------
def get_all_faqs() -> List[Dict]:
    """
    Returns all FAQs in the knowledge base for the Admin Dashboard.
    """
    faqs = faq_collection.find({})
    results = []

    for faq in faqs:
        results.append({
            "faq_id": str(faq["_id"]),
            "question": faq.get("question"),
            "answer": faq.get("answer"),
            "category": faq.get("category", "General"),
            "updated_at": faq.get("updated_at"),
        })

    return results

# -------------------------------------------------
# Add new FAQ (With JSON Save + RAG Sync)
# -------------------------------------------------
def add_faq(question: str, answer: str, category: str = "General") -> None:
    """
    Adds a new FAQ entry to Mongo, saves it as a JSON file, 
    and triggers FAISS re-indexing so the AI can retrieve it.
    """

    # 1️⃣ Save to MongoDB
    faq_collection.insert_one({
        "question": question,
        "answer": answer,
        "category": category,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    # 2️⃣ Create file in knowledge_base folder
    # Assuming this file is in backend/app/services/faq_service.py
    # parents[0]=services, [1]=app, [2]=backend, [3]=root
    BASE_DIR = Path(__file__).resolve().parents[3] 
    kb_path = BASE_DIR / "data" / "knowledge_base"
    kb_path.mkdir(parents=True, exist_ok=True)

    # Safe filename
    # Remove special chars, replace spaces with underscores
    safe_name = re.sub(r'[^a-zA-Z0-9 ]', '', question)
    safe_name = safe_name.replace(" ", "_")
    
    # Limit filename length just in case
    safe_name = safe_name[:50] 
    
    file_path = kb_path / f"{safe_name}.json"

    content = {
        "question": question,
        "answer": answer,
        "category": category
    }

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(content, f, indent=2)

    # 3️⃣ Rebuild FAISS index
    print(f"✅ FAQ saved to {file_path}. Rebuilding index...")
    rebuild_index()

# -------------------------------------------------
# Update existing FAQ
# -------------------------------------------------
def update_faq(
    faq_id: str,
    question: Optional[str] = None,
    answer: Optional[str] = None,
) -> None:
    """
    Updates an existing FAQ and refreshes the AI knowledge base.
    """
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
    
    # Refresh the vector index after updates
    rebuild_index()

# -------------------------------------------------
# Delete FAQ
# -------------------------------------------------
def delete_faq(faq_id: str) -> None:
    """
    Deletes an FAQ from MongoDB and rebuilds FAISS index.
    """
    result = faq_collection.delete_one({"_id": ObjectId(faq_id)})

    if result.deleted_count == 0:
        raise ValueError("FAQ not found")

    rebuild_index()

# -------------------------------------------------
# Internal helper
# -------------------------------------------------
def _to_object_id(faq_id: str):
    return ObjectId(faq_id)