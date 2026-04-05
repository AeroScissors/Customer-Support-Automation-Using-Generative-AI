from typing import List, Dict, Optional
from datetime import datetime
from app.db.mongo import tickets_collection, users_collection
from app.utils.security import hash_password
import uuid

# -------------------------------------------------
# 🔥 NEW: Ticket Metrics (for Dashboard Cards)
# -------------------------------------------------
def get_ticket_metrics() -> Dict:
    """
    Aggregates ticket counts by status for the Agent Dashboard metrics bar.
    Using count_documents is more efficient than loading the full list into memory.
    """
    # Open: Count of tickets currently in the queue (Escalated)
    # Using your specific logic: filter for "ESCALATED" status
    open_count = tickets_collection.count_documents({"status": "ESCALATED"})
    
    # Total Escalated: Specific count of escalated tickets
    escalated_count = tickets_collection.count_documents({"status": "ESCALATED"})
    
    # Resolved: Count of tickets handled by AI
    resolved_count = tickets_collection.count_documents({"status": "AI_RESOLVED"})
    
    # Closed: Finalized tickets
    closed_count = tickets_collection.count_documents({"status": "CLOSED"})

    return {
        "open": open_count,
        "total_escalated": escalated_count,
        "resolved": resolved_count,
        "closed": closed_count,
    }

# -------------------------------------------------
# 🔥 NEW: Fetch All Agents
# -------------------------------------------------
def get_all_agents() -> List[Dict]:
    """
    Returns a list of all provisioned support agents for the Admin view.
    """
    users = users_collection.find({"role": "agent"})
    return [
        {
            "user_id": str(u.get("_id")),
            "username": u.get("username"),
            "role": u.get("role"),
            "status": u.get("status", "online")
        }
        for u in users
    ]

# -------------------------------------------------
# Fetch escalated / pending tickets
# -------------------------------------------------
def get_escalated_tickets() -> List[Dict]:
    """Returns all tickets requiring human intervention."""
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
    print("Creating agent:", username)

    if users_collection.find_one({"username": username}):
        raise ValueError("Agent already exists")

    from app.utils.security import hash_password
    import uuid

    password_hash = hash_password(password)

    new_agent = {
        "user_id": f"user_{uuid.uuid4().hex[:8]}",
        "username": username,
        "password_hash": password_hash,
        "role": "agent",
        "status": "idle",
        "created_at": datetime.utcnow()
    }

    print("Inserting:", new_agent)

    users_collection.insert_one(new_agent)

    print("Inserted successfully")

    return {"username": username, "status": "idle"}

# -------------------------------------------------
# Workforce Metrics
# -------------------------------------------------
def get_agent_metrics() -> Dict:
    """
    Returns real-time workforce status.
    Matches the 'Agents Online', 'Active', 'Idle' dashboard cards.
    """
    online = users_collection.count_documents({"role": "agent"})
    active = users_collection.count_documents({"role": "agent", "status": "active"})
    idle = users_collection.count_documents({"role": "agent", "status": "idle"})

    total_escalated = tickets_collection.count_documents({"status": "ESCALATED"})
    avg_load = round(total_escalated / online, 1) if online > 0 else 0

    return {
        "online": online,
        "active": active,
        "idle": idle,
        "avgTickets": avg_load
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
                "status": "RESOLVED",
                "resolved_at": datetime.utcnow(),
            }
        }
    )
    if not result:
        raise ValueError("Ticket not found")

# -------------------------------------------------
# Agent closes ticket without response
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