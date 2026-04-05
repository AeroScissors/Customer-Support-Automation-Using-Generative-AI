from pydantic import BaseModel, Field
from datetime import datetime


# --------------------------------------------------
# FAQ Create Model (INPUT)
# Used when admin creates or updates an FAQ
# --------------------------------------------------
class FAQCreate(BaseModel):
    category: str = Field(..., description="FAQ category (refunds, delivery, payments, etc.)")
    question: str = Field(..., description="FAQ question")
    answer: str = Field(..., description="FAQ answer")


# --------------------------------------------------
# FAQ Response Model (OUTPUT)
# Used in API responses
# --------------------------------------------------
class FAQResponse(BaseModel):
    faq_id: str = Field(..., description="Unique FAQ identifier")
    category: str
    question: str
    answer: str
    created_at: datetime
