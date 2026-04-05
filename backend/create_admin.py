from app.db.mongo import get_db
from app.models.user import User
from app.utils.security import hash_password
from datetime import datetime
import uuid

db = get_db()

admin = User(
    user_id=f"user_{uuid.uuid4().hex[:8]}",
    username="admin1",
    password_hash=hash_password("admin123"),
    role="admin",
    created_at=datetime.utcnow(),
)

db.users.insert_one(admin.dict())

print("Admin recreated successfully.")