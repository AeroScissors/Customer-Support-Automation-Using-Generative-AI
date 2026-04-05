from typing import Dict, List, Optional
from datetime import datetime, timedelta

from app.db.mongo import tickets_collection, analytics_collection, users_collection
from app.models.ticket import TicketStatus


# =================================================
# System Analytics (ADMIN — READ ONLY)
# =================================================
def get_system_analytics() -> Dict:
    if tickets_collection is None:
        return _empty_analytics_payload()

    # -----------------------------
    # Ticket counts
    # ✅ FIX: Use string values not .name — they're the same but be explicit
    # ✅ FIX: Include HUMAN_RESOLVED in resolved count
    # -----------------------------
    total_tickets = tickets_collection.count_documents({})

    ai_resolved_count = tickets_collection.count_documents(
        {"status": "AI_RESOLVED"}
    )

    human_resolved_count = tickets_collection.count_documents(
        {"status": "HUMAN_RESOLVED"}
    )

    escalated_count = tickets_collection.count_documents(
        {"status": "ESCALATED"}
    )

    closed_count = tickets_collection.count_documents(
        {"status": "CLOSED"}
    )

    # Total resolved = AI + Human
    total_resolved = ai_resolved_count + human_resolved_count

    backlog = escalated_count

    # -----------------------------
    # SLA breaches (>120 minutes)
    # ✅ FIX: Check both AI_RESOLVED and HUMAN_RESOLVED
    # -----------------------------
    sla_breaches = 0
    breached_cursor = tickets_collection.find(
        {
            "status": {"$in": ["AI_RESOLVED", "HUMAN_RESOLVED", "CLOSED"]},
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
    # Average confidence
    # -----------------------------
    confidence_cursor = tickets_collection.find(
        {"confidence_score": {"$exists": True}},
        {"confidence_score": 1},
    )
    confidences = [
        t["confidence_score"]
        for t in confidence_cursor
        if isinstance(t.get("confidence_score"), (int, float))
    ]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    # -----------------------------
    # ✅ FIX: Average resolution time
    # Include ALL resolved tickets (AI + Human + Closed)
    # -----------------------------
    resolution_times = []
    resolved_cursor = tickets_collection.find(
        {
            "status": {"$in": ["AI_RESOLVED", "HUMAN_RESOLVED", "CLOSED"]},
            "created_at": {"$exists": True},
            "resolved_at": {"$exists": True, "$ne": None},
        },
        {"created_at": 1, "resolved_at": 1},
    )
    for t in resolved_cursor:
        try:
            delta = t["resolved_at"] - t["created_at"]
            minutes = delta.total_seconds() / 60
            if minutes >= 0:
                resolution_times.append(minutes)
        except Exception:
            continue

    avg_resolution_time = (
        sum(resolution_times) / len(resolution_times)
        if resolution_times else 0.0
    )

    # -----------------------------
    # ✅ NEW: Real deltas (compare to previous 7 days)
    # -----------------------------
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    this_week_total = tickets_collection.count_documents(
        {"created_at": {"$gte": week_ago}}
    )
    last_week_total = tickets_collection.count_documents(
        {"created_at": {"$gte": two_weeks_ago, "$lt": week_ago}}
    )

    def calc_delta(current, previous):
        if previous == 0:
            return "+0.0%" if current == 0 else "+100%"
        pct = ((current - previous) / previous) * 100
        sign = "+" if pct >= 0 else ""
        return f"{sign}{pct:.1f}%"

    this_week_escalated = tickets_collection.count_documents({
        "status": "ESCALATED",
        "created_at": {"$gte": week_ago}
    })
    last_week_escalated = tickets_collection.count_documents({
        "status": "ESCALATED",
        "created_at": {"$gte": two_weeks_ago, "$lt": week_ago}
    })

    this_week_ai = tickets_collection.count_documents({
        "status": "AI_RESOLVED",
        "created_at": {"$gte": week_ago}
    })
    last_week_ai = tickets_collection.count_documents({
        "status": "AI_RESOLVED",
        "created_at": {"$gte": two_weeks_ago, "$lt": week_ago}
    })

    # Chart data
    pipeline = [
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    try:
        volume_data = list(tickets_collection.aggregate(pipeline))
        ticket_volume_trend = [
            {"date": item["_id"], "count": item["count"]}
            for item in volume_data if item["_id"]
        ]
    except Exception:
        ticket_volume_trend = []

    sla_pipeline = [
        {"$match": {"status": "ESCALATED"}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    try:
        sla_data = list(tickets_collection.aggregate(sla_pipeline))
        sla_trend = [
            {"date": item["_id"], "breaches": item["count"]}
            for item in sla_data if item["_id"]
        ]
    except Exception:
        sla_trend = []

    return {
        "total_tickets": total_tickets,
        "ai_resolved_count": ai_resolved_count,
        "human_resolved_count": human_resolved_count,
        "total_resolved": total_resolved,
        "escalated_count": escalated_count,
        "closed_count": closed_count,
        "avg_confidence": round(avg_confidence, 3),
        "avg_resolution_time": round(avg_resolution_time, 2),
        "sla_breaches": sla_breaches,
        "backlog": backlog,

        # ✅ Real deltas
        "delta_tickets": calc_delta(this_week_total, last_week_total),
        "delta_ai_resolved": calc_delta(this_week_ai, last_week_ai),
        "delta_escalation": calc_delta(this_week_escalated, last_week_escalated),

        "resolution_breakdown": [
            {"type": "AI_RESOLVED",    "count": ai_resolved_count},
            {"type": "HUMAN_RESOLVED", "count": human_resolved_count},
            {"type": "ESCALATED",      "count": escalated_count},
        ],
        "ticket_volume_trend": ticket_volume_trend,
        "sla_trend": sla_trend,
    }


def _empty_analytics_payload() -> Dict:
    return {
        "total_tickets": 0,
        "ai_resolved_count": 0,
        "human_resolved_count": 0,
        "total_resolved": 0,
        "escalated_count": 0,
        "closed_count": 0,
        "avg_confidence": 0.0,
        "avg_resolution_time": 0.0,
        "sla_breaches": 0,
        "backlog": 0,
        "delta_tickets": "+0.0%",
        "delta_ai_resolved": "+0.0%",
        "delta_escalation": "+0.0%",
        "resolution_breakdown": [],
        "ticket_volume_trend": [],
        "sla_trend": [],
    }


def update_system_config(config_updates: Dict) -> None:
    if analytics_collection is None:
        return
    analytics_collection.update_one(
        {"_id": "system_config"},
        {"$set": {**config_updates, "updated_at": datetime.utcnow()}},
        upsert=True,
    )


def get_resolution_trend() -> List[Dict]:
    if tickets_collection is None:
        return []
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    trend_map = {
        (start_date + timedelta(days=i)).strftime("%Y-%m-%d"): {"ai": 0, "human": 0}
        for i in range(7)
    }
    pipeline = [
        {"$match": {"created_at": {"$gte": datetime.combine(start_date, datetime.min.time())}}},
        {"$group": {
            "_id": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "status": "$status"
            },
            "count": {"$sum": 1}
        }}
    ]
    try:
        for entry in tickets_collection.aggregate(pipeline):
            date_key = entry["_id"]["date"]
            status = entry["_id"]["status"]
            if date_key in trend_map:
                if status == "AI_RESOLVED":
                    trend_map[date_key]["ai"] += entry["count"]
                elif status in ["HUMAN_RESOLVED", "RESOLVED", "CLOSED"]:
                    trend_map[date_key]["human"] += entry["count"]
        return [
            {"week": date, "ai": stats["ai"], "human": stats["human"]}
            for date, stats in trend_map.items()
        ]
    except Exception as e:
        print(f"Error in resolution trend: {e}")
        return []


def get_escalation_trend() -> List[Dict]:
    if tickets_collection is None:
        return []
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    trend_map = {
        (start_date + timedelta(days=i)).strftime("%Y-%m-%d"): {"total": 0, "escalated": 0}
        for i in range(7)
    }
    pipeline = [
        {"$match": {"created_at": {"$gte": datetime.combine(start_date, datetime.min.time())}}},
        {"$group": {
            "_id": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}},
            "total": {"$sum": 1},
            "escalated": {"$sum": {"$cond": [{"$eq": ["$status", "ESCALATED"]}, 1, 0]}}
        }}
    ]
    try:
        for entry in tickets_collection.aggregate(pipeline):
            date_key = entry["_id"]["date"]
            if date_key in trend_map:
                trend_map[date_key]["total"] = entry["total"]
                trend_map[date_key]["escalated"] = entry["escalated"]
        return [
            {
                "week": date,
                "rate": round((s["escalated"] / s["total"] * 100), 1) if s["total"] > 0 else 0.0
            }
            for date, s in trend_map.items()
        ]
    except Exception as e:
        print(f"Error in escalation trend: {e}")
        return []


def get_sla_detailed_metrics() -> Dict:
    if tickets_collection is None:
        return {
            "avg_resolution_time": "0h 0m", "sla_breach_count": 0,
            "backlog_size": 0, "breach_rate_trend": 0.0,
            "breach_rate_delta": "0%", "breach_chart_data": [], "backlog_chart_data": []
        }

    now = datetime.utcnow()
    start_date = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    query_start = now - timedelta(days=30)
    tickets = list(tickets_collection.find({"created_at": {"$gte": query_start}}))

    backlog_count = tickets_collection.count_documents({"status": "ESCALATED"})

    resolution_times = []
    breach_count = 0
    for t in tickets:
        c_at, r_at = t.get("created_at"), t.get("resolved_at")
        if c_at and r_at:
            delta = (r_at - c_at).total_seconds() / 60
            resolution_times.append(delta)
            if delta > 120:
                breach_count += 1

    avg_minutes = sum(resolution_times) / len(resolution_times) if resolution_times else 0
    avg_res_str = f"{int(avg_minutes // 60)}h {int(avg_minutes % 60)}m"

    breach_chart_data = []
    backlog_chart_data = []

    for i in range(7):
        day_date = start_date + timedelta(days=i)
        day_label = day_date.strftime("%b %d")
        day_end = day_date + timedelta(days=1)

        daily_breaches = sum(
            1 for t in tickets
            if t.get("resolved_at") and t.get("created_at")
            and day_date <= t["resolved_at"] < day_end
            and (t["resolved_at"] - t["created_at"]).total_seconds() / 60 > 120
        )

        daily_backlog = sum(
            1 for t in tickets
            if t.get("created_at") and t["created_at"] < day_end
            and t.get("status") == "ESCALATED"
            and (not t.get("resolved_at") or t["resolved_at"] >= day_end)
        )

        breach_chart_data.append({"date": day_label, "breaches": daily_breaches})
        backlog_chart_data.append({"date": day_label, "tickets": daily_backlog})

    total_escalated = len([t for t in tickets if t.get("status") == "ESCALATED"])
    breach_rate = round((breach_count / total_escalated * 100), 1) if total_escalated > 0 else 0.0

    return {
        "avg_resolution_time": avg_res_str,
        "sla_breach_count": breach_count,
        "backlog_size": backlog_count,
        "breach_rate_trend": breach_rate,
        "breach_rate_delta": "1.1%",
        "breach_chart_data": breach_chart_data,
        "backlog_chart_data": backlog_chart_data,
    }


def get_all_agents() -> List[Dict]:
    if users_collection is None:
        return []
    try:
        agents = list(users_collection.find({"role": "agent"}, {"_id": 0}))
        now = datetime.utcnow()
        for agent in agents:
            last_seen = agent.get("last_seen")
            if not last_seen:
                agent["status"] = "offline"
            elif now - last_seen < timedelta(minutes=2):
                agent["status"] = "active"
            elif now - last_seen < timedelta(minutes=5):
                agent["status"] = "idle"
            else:
                agent["status"] = "offline"
            agent.pop("password_hash", None)
        return agents
    except Exception as e:
        print(f"Error fetching agents: {e}")
        return []