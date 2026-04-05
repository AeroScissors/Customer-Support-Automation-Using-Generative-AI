from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime


class User(BaseModel):
    user_id: str
    username: str
    password_hash: str
    role: Literal["admin", "agent"]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen: Optional[datetime] = None