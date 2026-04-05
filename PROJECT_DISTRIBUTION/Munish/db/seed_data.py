from datetime import datetime, timedelta
import uuid
import random

from app.db.mongo import tickets_collection, faq_collection, db
from app.models.ticket import TicketStatus
from app.models.user import User
from app.utils.security import hash_password


# --------------------------------------------------
# PROFESSIONAL DEMO SEED (CONTROLLED METRICS)
# --------------------------------------------------

TOTAL_TICKETS = 16
AI_RESOLVED_COUNT = 11
ESCALATED_COUNT = 5
SLA_BREACH_COUNT = 2


AGENT_NAMES = [
    "Rahul Mehta",
    "Priya Sharma",
    "Arjun Verma",
    "Sneha Kapoor",
    "Amit Joshi",
    "Neha Gupta",
    "Karan Malhotra",
    "Ishita Rao",
    "Rohan Singh",
    "Ananya Das",
    "Vikram Patel",
    "Pooja Nair",
    "Aditya Roy",
    "Simran Kaur",
    "Harsh Vardhan",
    "Meera Iyer",
    "Siddharth Jain",
    "Tanya Khanna",
    "Dev Bansal",
    "Ritika Sethi"
]


# --------------------------------------------------
# TICKETS
# --------------------------------------------------

def seed_tickets():

    if tickets_collection.count_documents({}) > 0:
        print("[Seed] Tickets already exist. Skipping.")
        return

    now = datetime.utcnow()
    tickets = []

    print("[Seed] Creating structured demo dataset...")

    # ------------------------------
    # 1️⃣ AI RESOLVED
    # ------------------------------

    for i in range(AI_RESOLVED_COUNT):

        created = now - timedelta(days=6 - i, minutes=10 * i)

        tickets.append({
            "ticket_id": f"TICKET-{uuid.uuid4().hex[:6].upper()}",
            "user_id": f"user_{uuid.uuid4().hex[:4]}",
            "query": "How do I track my order?",
            "ai_response": "You can track your order from the Orders section in your profile.",
            "confidence_score": 0.82 + (i * 0.01),
            "decision": "AUTO_RESOLVE",
            "decision_reason": "High confidence FAQ match",
            "status": TicketStatus.AI_RESOLVED.value,
            "created_at": created,
            "resolved_at": created + timedelta(minutes=15),
            "messages": [
                {
                    "sender": "customer",
                    "content": "How do I track my order?",
                    "timestamp": created,
                },
                {
                    "sender": "ai",
                    "content": "You can track your order from the Orders section in your profile.",
                    "timestamp": created + timedelta(minutes=1),
                }
            ]
        })

    # ------------------------------
    # 2️⃣ ESCALATED
    # ------------------------------

    for i in range(ESCALATED_COUNT):

        created = now - timedelta(days=i)

        if i < SLA_BREACH_COUNT:
            resolved_at = created + timedelta(minutes=180)
        else:
            resolved_at = None

        assigned_agent = random.choice(AGENT_NAMES)

        tickets.append({
            "ticket_id": f"TICKET-{uuid.uuid4().hex[:6].upper()}",
            "user_id": f"user_{uuid.uuid4().hex[:4]}",
            "query": "Payment deducted but order failed",
            "ai_response": None,
            "confidence_score": 0.42,
            "decision": "ESCALATE",
            "decision_reason": "Low confidence score",
            "status": TicketStatus.ESCALATED.value,
            "assigned_agent": assigned_agent,
            "created_at": created,
            "resolved_at": resolved_at,
            "messages": [
                {
                    "sender": "customer",
                    "content": "Payment deducted but order failed",
                    "timestamp": created,
                },
                {
                    "sender": "agent",
                    "content": "We are reviewing your payment issue. Please allow some time.",
                    "timestamp": created + timedelta(minutes=25),
                }
            ]
        })

    tickets_collection.insert_many(tickets)

    print(f"[Seed] Inserted {TOTAL_TICKETS} demo tickets.")
    print("       AI Resolved: 69%")
    print("       Escalation Rate: 31%")
    print("       SLA Breaches: 2")


# --------------------------------------------------
# FAQ
# --------------------------------------------------

def seed_faqs():

    if faq_collection.count_documents({}) > 0:
        print("[Seed] FAQs already exist. Skipping.")
        return

    faqs = [
        {
            "question": "Why was my payment deducted twice?",
            "answer": "Duplicate charges are usually reversed within 3–5 working days.",
            "category": "payments",
            "created_at": datetime.utcnow(),
        },
        {
            "question": "How do I track my order?",
            "answer": "Log in → Orders → Select order → Click 'Track Shipment'.",
            "category": "general",
            "created_at": datetime.utcnow(),
        },
        {
            "question": "How long do refunds take?",
            "answer": "Refunds are processed within 5–7 working days.",
            "category": "payments",
            "created_at": datetime.utcnow(),
        },
    ]

    faq_collection.insert_many(faqs)
    print("[Seed] Knowledge Base seeded.")


# --------------------------------------------------
# USERS (20 AGENTS + ADMIN)
# --------------------------------------------------

def seed_users():

    users_collection = db["users"]

    if users_collection.count_documents({"role": "agent"}) > 0:
        print("[Seed] Agents already exist. Skipping.")
    else:
        for name in AGENT_NAMES:
            username = name.lower().replace(" ", "")
            agent = User(
                user_id=f"user_{uuid.uuid4().hex[:8]}",
                username=username,
                password_hash=hash_password("agent123"),
                role="agent",
                created_at=datetime.utcnow(),
            )
            users_collection.insert_one(agent.dict())

        print("[Seed] Inserted 20 professional demo agents.")

    if not users_collection.find_one({"username": "admin1"}):
        admin = User(
            user_id=f"user_{uuid.uuid4().hex[:8]}",
            username="admin1",
            password_hash=hash_password("admin123"),
            role="admin",
            created_at=datetime.utcnow(),
        )
        users_collection.insert_one(admin.dict())
        print("[Seed] Demo admin inserted.")


# --------------------------------------------------
# ENTRY POINT
# --------------------------------------------------

##def run_seed():
    print("🌱 Running PROFESSIONAL demo seed...")
    seed_tickets()
    seed_faqs()
    seed_users()
    print("✅ Demo environment ready.")
