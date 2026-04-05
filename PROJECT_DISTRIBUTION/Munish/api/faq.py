from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict

# Importing the service logic that handles MongoDB and FAISS sync
from app.services.faq_service import (
    get_all_faqs,
    add_faq,
    update_faq,
)
from app.core.auth import jwt  # For Admin-only protection

# --------------------------------------------------
# Router
# --------------------------------------------------
router = APIRouter(
    prefix="/faq",
    tags=["FAQ"],
)

# --------------------------------------------------
# Schemas
# --------------------------------------------------
class FAQCreateRequest(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "General"  # Supports your 5+ manual categories


class FAQUpdateRequest(BaseModel):
    faq_id: str
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None


# --------------------------------------------------
# GET /faq
# --------------------------------------------------
@router.get("/", response_model=List[Dict])
def fetch_faqs():
    """
    Public FAQ fetch endpoint.
    Used by RAG and admin views to list knowledge entries.
    """
    try:
        return get_all_faqs()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch FAQs: {str(e)}",
        )


# --------------------------------------------------
# POST /faq
# --------------------------------------------------
@router.post("/")
def create_faq(payload: FAQCreateRequest, current_user=Depends(jwt.get_current_admin)):
    """
    Add a new FAQ entry. Protected: Only Admin can manage knowledge base.
    Triggers FAISS re-indexing for real-time AI learning.
    """
    try:
        add_faq(
            question=payload.question,
            answer=payload.answer,
            category=payload.category,
        )
        return {
            "status": "success",
            "message": "FAQ added and AI knowledge updated",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to add FAQ to knowledge base",
        )


# --------------------------------------------------
# PUT /faq
# --------------------------------------------------
@router.put("/")
def modify_faq(payload: FAQUpdateRequest, current_user=Depends(jwt.get_current_admin)):
    """
    Update an existing FAQ entry and refresh the vector index.
    """
    try:
        update_faq(
            faq_id=payload.faq_id,
            question=payload.question,
            answer=payload.answer,
            category=payload.category,
        )
        return {
            "status": "success",
            "message": "FAQ updated successfully",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to update FAQ",
        )


# --------------------------------------------------
# DELETE /faq/{faq_id}
# --------------------------------------------------
@router.delete("/{faq_id}")
def delete_faq(faq_id: str, current_user=Depends(jwt.get_current_admin)):
    """
    Delete an FAQ entry and refresh the AI index.
    """
    try:
        # Local import to avoid circular dependency or missing top-level import
        from app.services.faq_service import delete_faq as delete_faq_service

        delete_faq_service(faq_id)

        return {
            "status": "success",
            "message": "FAQ deleted successfully",
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete FAQ",
        )