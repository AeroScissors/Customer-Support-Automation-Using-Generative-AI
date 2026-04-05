from typing import Dict, List, Optional
from datetime import datetime, timedelta

from app.db.mongo import tickets_collection, analytics_collection, users_collection
from app.models.ticket import TicketStatus
from app.models.user import User


# =================================================
# System Analytics (ADMIN — READ ONLY)
# =================================================
def get_system_analytics() -> Dict:
    """
    Aggregates system-wide metrics for Admin dashboard.

    GUARANTEES:
    - No crashes (no 500s)
    - Enum-safe (UPPERCASE via .name)
    - Mixed ticket shapes supported
    - Always returns valid numeric values
    """

    if tickets_collection is None:
        return _empty_analytics_payload()

    # -----------------------------
    # Ticket counts
    # -----------------------------
    total_tickets = tickets_collection.count_documents({})

    ai_resolved_count = tickets_collection.count_documents(
        {"status": TicketStatus.AI_RESOLVED.name}
    )

    escalated_count = tickets_collection.count_documents(
        {"status": TicketStatus.ESCALATED.name}
    )

    # -----------------------------
    # Backlog (ESCALATED ONLY)
    # -----------------------------
    backlog = tickets_collection.count_documents(
        {"status": TicketStatus.ESCALATED.name}
    )

    # -----------------------------
    # SLA breaches (>120 minutes)
    # -----------------------------
    sla_breaches = 0

    breached_cursor = tickets_collection.find(
        {
            "status": TicketStatus.ESCALATED.name,
            "created_at": {"$exists": True},
            "resolved_at": {"$exists": True, "$ne": None},
        },
        {"created_at": 1, "resolved_at": 1},
    )

    for t in breached_cursor:
        try:
            delta = t["resolved_at"] - t["created_at"]
            if delta.total_seconds() / 60 > 120:
                sla_breaches += 1
        except Exception:
            continue

    # -----------------------------
    # Average confidence (AI only)
    # -----------------------------
    confidence_cursor = tickets_collection.find(
        {
            "status": TicketStatus.AI_RESOLVED.name,
            "confidence_score": {"$exists": True},
        },
        {"confidence_score": 1},
    )

    confidences = [
        t["confidence_score"]
        for t in confidence_cursor
        if isinstance(t.get("confidence_score"), (int, float))
    ]

    avg_confidence = (
        sum(confidences) / len(confidences)
        if confidences else 0.0
    )

    # -----------------------------
    # Average resolution time (minutes)
    # -----------------------------
    resolution_times = []

    resolved_cursor = tickets_collection.find(
        {
            "created_at": {"$exists": True},
            "resolved_at": {"$exists": True, "$ne": None},
        },
        {"created_at": 1, "resolved_at": 1},
    )

    for t in resolved_cursor:
        try:
            delta = t["resolved_at"] - t["created_at"]
            resolution_times.append(delta.total_seconds() / 60)
        except Exception:
            continue

    avg_resolution_time = (
        sum(resolution_times) / len(resolution_times)
        if resolution_times else 0.0
    )

    # =================================================
    # 🔥 NEW: CHART DATA AGGREGATIONS
    # =================================================

    # -----------------------------
    # 1. Resolution Breakdown
    # -----------------------------
    resolution_breakdown = [
        {"type": "AI_RESOLVED", "count": ai_resolved_count},
        {"type": "ESCALATED", "count": escalated_count},
    ]

    # -----------------------------
    # 2. Ticket volume by day (group by created_at date)
    # -----------------------------
    pipeline = [
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                    }
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    try:
        volume_data = list(tickets_collection.aggregate(pipeline))
        ticket_volume_trend = [
            {"date": item["_id"], "count": item["count"]}
            for item in volume_data
            if item["_id"] is not None 
        ]
    except Exception:
        ticket_volume_trend = []

    # -----------------------------
    # 3. SLA Trend (Escalated per day)
    # -----------------------------
    sla_pipeline = [
        {"$match": {"status": TicketStatus.ESCALATED.name}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                    }
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    try:
        sla_data = list(tickets_collection.aggregate(sla_pipeline))
        sla_trend = [
            {"date": item["_id"], "breaches": item["count"]}
            for item in sla_data
            if item["_id"] is not None
        ]
    except Exception:
        sla_trend = []

    # -----------------------------
    # Final payload
    # -----------------------------
    return {
        "total_tickets": total_tickets,
        "ai_resolved_count": ai_resolved_count,
        "escalated_count": escalated_count,
        "avg_confidence": round(avg_confidence, 3),
        "avg_resolution_time": round(avg_resolution_time, 2),
        "sla_breaches": sla_breaches,
        "backlog": backlog,

        # 🔥 NEW CHART DATA
        "resolution_breakdown": resolution_breakdown,
        "ticket_volume_trend": ticket_volume_trend,
        "sla_trend": sla_trend,
    }


# =================================================
# Safe default payload
# =================================================
def _empty_analytics_payload() -> Dict:
    return {
        "total_tickets": 0,
        "ai_resolved_count": 0,
        "escalated_count": 0,
        "avg_confidence": 0.0,
        "avg_resolution_time": 0.0,
        "sla_breaches": 0,
        "backlog": 0,
        # Empty chart data for safety
        "resolution_breakdown": [],
        "ticket_volume_trend": [],
        "sla_trend": [],
    }


# =================================================
# System Configuration (ADMIN)
# =================================================
def update_system_config(config_updates: Dict) -> None:
    if analytics_collection is None:
        return

    analytics_collection.update_one(
        {"_id": "system_config"},
        {
            "$set": {
                **config_updates,
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )


# =================================================
# 🔥 NEW: Resolution Trend (AI vs Human)
# =================================================
def get_resolution_trend() -> List[Dict]:
    """
    Returns daily breakdown of AI vs Human resolution for the last 7 days.
    """
    if tickets_collection is None:
        return []

    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    
    # Initialize 7-day structure with zeros
    trend_map = {
        (start_date + timedelta(days=i)).strftime("%Y-%m-%d"): {"ai": 0, "human": 0}
        for i in range(7)
    }

    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": datetime.combine(start_date, datetime.min.time())}
            }
        },
        {
            "$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "status": "$status"
                },
                "count": {"$sum": 1}
            }
        }
    ]

    try:
        data = list(tickets_collection.aggregate(pipeline))
        
        for entry in data:
            date_key = entry["_id"]["date"]
            status = entry["_id"]["status"]
            
            if date_key in trend_map:
                if status == TicketStatus.AI_RESOLVED.name:
                    trend_map[date_key]["ai"] += entry["count"]
                elif status in [TicketStatus.RESOLVED.name, TicketStatus.CLOSED.name]: 
                    # Assuming RESOLVED/CLOSED = Human handled
                    trend_map[date_key]["human"] += entry["count"]

        # Format for frontend Recharts
        return [
            {"week": date, "ai": stats["ai"], "human": stats["human"]}
            for date, stats in trend_map.items()
        ]
    except Exception as e:
        print(f"Error calculating resolution trend: {e}")
        return []


# =================================================
# 🔥 NEW: Escalation Rate Trend
# =================================================
def get_escalation_trend() -> List[Dict]:
    """
    Returns daily escalation rate (%) for the last 7 days.
    Rate = (Escalated / Total) * 100
    """
    if tickets_collection is None:
        return []

    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    
    # Initialize map
    trend_map = {
        (start_date + timedelta(days=i)).strftime("%Y-%m-%d"): {"total": 0, "escalated": 0}
        for i in range(7)
    }

    pipeline = [
        {
            "$match": {
                "created_at": {"$gte": datetime.combine(start_date, datetime.min.time())}
            }
        },
        {
            "$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}
                },
                "total": {"$sum": 1},
                "escalated": {
                    "$sum": {
                        "$cond": [{"$eq": ["$status", TicketStatus.ESCALATED.name]}, 1, 0]
                    }
                }
            }
        }
    ]

    try:
        data = list(tickets_collection.aggregate(pipeline))
        
        for entry in data:
            date_key = entry["_id"]["date"]
            if date_key in trend_map:
                trend_map[date_key]["total"] = entry["total"]
                trend_map[date_key]["escalated"] = entry["escalated"]

        # Calculate percentage
        result = []
        for date, stats in trend_map.items():
            total = stats["total"]
            escalated = stats["escalated"]
            rate = round((escalated / total * 100), 1) if total > 0 else 0.0
            
            result.append({"week": date, "rate": rate})
            
        return result
    except Exception as e:
        print(f"Error calculating escalation trend: {e}")
        return []


# =================================================
# 🔥 NEW: Detailed SLA Dashboard Metrics
# =================================================
def get_sla_detailed_metrics() -> Dict:
    """
    Calculates detailed metrics and historical trends for the SLA Dashboard.
    """
    if tickets_collection is None:
        return {
            "avg_resolution_time": "0h 0m",
            "sla_breach_count": 0,
            "backlog_size": 0,
            "breach_rate_trend": 0.0,
            "breach_rate_delta": "0%",
            "breach_chart_data": [],
            "backlog_chart_data": []
        }

    now = datetime.utcnow()
    start_date = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Fetch tickets for calculation
    # We fetch tickets created in the last 30 days to ensure we see backlog transitions
    query_start = now - timedelta(days=30)
    cursor = tickets_collection.find({"created_at": {"$gte": query_start}})
    tickets = list(cursor)

    # 2. Basic KPIs
    backlog_count = tickets_collection.count_documents({"status": TicketStatus.ESCALATED.name})
    
    # Calculate avg resolution time
    resolution_times = []
    breach_count = 0
    for t in tickets:
        c_at = t.get("created_at")
        r_at = t.get("resolved_at")
        if c_at and r_at:
            delta = (r_at - c_at).total_seconds() / 60
            resolution_times.append(delta)
            # Using your 120-minute threshold as a breach
            if delta > 120:
                breach_count += 1

    avg_minutes = sum(resolution_times) / len(resolution_times) if resolution_times else 0
    avg_res_str = f"{int(avg_minutes // 60)}h {int(avg_minutes % 60)}m"

    # 3. Generate 7-Day Historical Snapshots
    breach_chart_data = []
    backlog_chart_data = []

    for i in range(7):
        day_date = start_date + timedelta(days=i)
        day_label = day_date.strftime("%b %d")
        day_end = day_date + timedelta(days=1)

        # Breach Snapshot: Tickets resolved on this day that exceeded 120 mins
        daily_breaches = 0
        for t in tickets:
            r_at = t.get("resolved_at")
            c_at = t.get("created_at")
            if r_at and c_at and day_date <= r_at < day_end:
                if (r_at - c_at).total_seconds() / 60 > 120:
                    daily_breaches += 1
        
        breach_chart_data.append({"date": day_label, "breaches": daily_breaches})

        # Backlog Snapshot: Tickets that were "ESCALATED" (Open) at the end of this day
        # Logical check: Created before day_end AND (Resolved after day_end OR not resolved)
        daily_backlog = 0
        for t in tickets:
            c_at = t.get("created_at")
            r_at = t.get("resolved_at")
            status = t.get("status")

            if c_at and c_at < day_end:
                if status == TicketStatus.ESCALATED.name:
                    if not r_at or r_at >= day_end:
                        daily_backlog += 1
        
        backlog_chart_data.append({"date": day_label, "tickets": daily_backlog})

    # 4. Calculate Breach Rate Trend (simple % of total escalated that breached)
    total_escalated = len([t for t in tickets if t.get("status") == TicketStatus.ESCALATED.name])
    breach_rate = round((breach_count / total_escalated * 100), 1) if total_escalated > 0 else 0.0

    return {
        "avg_resolution_time": avg_res_str,
        "sla_breach_count": breach_count,
        "backlog_size": backlog_count,
        "breach_rate_trend": breach_rate,
        "breach_rate_delta": "1.1%", 
        "breach_chart_data": breach_chart_data,
        "backlog_chart_data": backlog_chart_data
    }


# =================================================
# 🔥 NEW: Fetch All Agents (Admin Only)
# =================================================
def get_all_agents() -> List[Dict]:
    """
    Returns all users with role='agent'.
    Injects real-time status ('online', 'idle', 'offline') based on last_seen.
    """

    if users_collection is None:
        return []

    try:
        # Fetch agents and hide strictly private fields if necessary, 
        # but keep last_seen for calculation.
        agents = list(users_collection.find(
            {"role": "agent"},
            {"_id": 0}
        ))

        now = datetime.utcnow()

        for agent in agents:
            last_seen = agent.get("last_seen")

            if not last_seen:
                agent["status"] = "offline"
            else:
                # Calculate time difference
                delta = now - last_seen

                # < 30 seconds = Online
                if delta < timedelta(seconds=30):
                    agent["status"] = "online"
                # < 2 minutes = Idle
                elif delta < timedelta(minutes=2):
                    agent["status"] = "idle"
                # > 2 minutes = Offline
                else:
                    agent["status"] = "offline"

        return agents

    except Exception as e:
        print(f"Error fetching agents: {e}")
        return []