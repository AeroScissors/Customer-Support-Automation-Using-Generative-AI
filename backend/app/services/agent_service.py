from typing import List, Dict, Optional
from datetime import datetime, timedelta
from app.db.mongo import tickets_collection, users_collection
from app.utils.security import hash_password
import uuid

# Agent is considered "online" if pinged within last 5 minutes
ONLINE_THRESHOLD = timedelta(minutes=5)
# Agent is "active" if pinged within last 2 minutes (ping fires every 20s)
ACTIVE_THRESHOLD = timedelta(minutes=2)


def _get_agent_status(last_seen) -> str:
    """
    Derive real-time status from last_seen timestamp.
    No more stale 'active' status sitting in DB forever.
    """
    if not last_seen:
        return "offline"
    now = datetime.utcnow()
    delta = now - last_seen
    if delta <= ACTIVE_THRESHOLD:
        return "active"
    if delta <= ONLINE_THRESHOLD:
        return "idle"
    return "offline"


# -------------------------------------------------
# Ticket Metrics (for Dashboard Cards)
# -------------------------------------------------
def get_ticket_metrics() -> Dict:
    open_count      = tickets_collection.count_documents({"status": "ESCALATED"})
    escalated_count = tickets_collection.count_documents({"status": "ESCALATED"})
    resolved_count  = tickets_collection.count_documents(
        {"status": {"$in": ["AI_RESOLVED", "HUMAN_RESOLVED"]}}
    )
    closed_count    = tickets_collection.count_documents({"status": "CLOSED"})

    return {
        "open": open_count,
        "total_escalated": escalated_count,
        "resolved": resolved_count,
        "closed": closed_count,
    }


# -------------------------------------------------
# Fetch All Agents
# -------------------------------------------------
def get_all_agents() -> List[Dict]:
    users = users_collection.find({"role": "agent"})
    return [
        {
            "user_id": str(u.get("_id")),
            "username": u.get("username"),
            "role": u.get("role"),
            # ✅ FIX: Derive status from last_seen instead of stale DB field
            "status": _get_agent_status(u.get("last_seen")),
            "last_seen": u.get("last_seen"),
        }
        for u in users
    ]


# -------------------------------------------------
# Fetch escalated / pending tickets
# -------------------------------------------------
def get_escalated_tickets() -> List[Dict]:
    tickets = tickets_collection.find({"status": {"$in": ["ESCALATED", "PENDING"]}})
    results = []
    for ticket in tickets:
        results.append({
            "ticket_id": ticket.get("ticket_id"),
            "customer_query": ticket.get("query"),
            "ai_response": ticket.get("ai_response"),
            "confidence_score": ticket.get("confidence_score", 0.0),
            "escalation_reason": ticket.get("escalation_reason", "N/A"),
            "status": ticket.get("status"),
        })
    return results


# -------------------------------------------------
# Create Agent Account
# -------------------------------------------------
def create_agent(username: str, password: str) -> Dict:
    if users_collection.find_one({"username": username}):
        raise ValueError("Agent already exists")

    password_hash = hash_password(password)
    new_agent = {
        "user_id": f"user_{uuid.uuid4().hex[:8]}",
        "username": username,
        "password_hash": password_hash,
        "role": "agent",
        "last_seen": None,
        "created_at": datetime.utcnow(),
    }
    users_collection.insert_one(new_agent)
    return {"username": username, "status": "offline"}


# -------------------------------------------------
# Workforce Metrics
# -------------------------------------------------
def get_agent_metrics() -> Dict:
    """
    ✅ FIX: Derive online/active/idle counts from last_seen
    instead of trusting the stale 'status' field in DB.
    """
    all_agents = list(users_collection.find({"role": "agent"}))

    online = 0
    active = 0
    idle   = 0

    for agent in all_agents:
        s = _get_agent_status(agent.get("last_seen"))
        if s in ("active", "idle"):
            online += 1
        if s == "active":
            active += 1
        if s == "idle":
            idle += 1

    total_escalated = tickets_collection.count_documents({"status": "ESCALATED"})
    avg_load = round(total_escalated / online, 1) if online > 0 else 0

    return {
        "online": online,
        "active": active,
        "idle": idle,
        "avgTickets": avg_load,
    }


# -------------------------------------------------
# Agent responds to a ticket
# -------------------------------------------------
def respond_to_ticket(ticket_id: str, agent_response: str) -> None:
    result = tickets_collection.find_one_and_update(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "agent_response": agent_response,
                "status": "HUMAN_RESOLVED",
                "resolved_at": datetime.utcnow(),
            }
        }
    )
    if not result:
        raise ValueError("Ticket not found")


# -------------------------------------------------
# Agent closes ticket
# -------------------------------------------------
def close_ticket(ticket_id: str, reason: Optional[str] = None) -> None:
    result = tickets_collection.find_one_and_update(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "status": "CLOSED",
                "closed_reason": reason or "Closed by agent",
                "closed_at": datetime.utcnow(),
            }
        }
    )
    if not result:
        raise ValueError("Ticket not found")