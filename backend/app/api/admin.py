from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timedelta

# 🔐 AUTH GUARD
from app.core.auth.dependencies import require_admin

# Services
from app.services.admin_service import (
    get_system_analytics,
    update_system_config,
    get_resolution_trend,
    get_escalation_trend,
    get_sla_detailed_metrics,  # 🔥 NEW: SLA Logic imported here
    get_all_agents             # 🔥 NEW: Agent fetch logic
)

from app.services.faq_service import (
    get_all_faqs,
    add_faq,
    update_faq,
)

from app.db.mongo import tickets_collection

# -------------------------------------------------
# Router (🔒 ADMIN PROTECTED)
# -------------------------------------------------
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_admin)],
)

# -------------------------------------------------
# Schemas
# -------------------------------------------------

# 🔥 NEW: SLA DASHBOARD SCHEMAS
class SLABreachPoint(BaseModel):
    date: str
    breaches: int

class SLABacklogPoint(BaseModel):
    date: str
    tickets: int

class SLADetailedResponse(BaseModel):
    avg_resolution_time: str
    sla_breach_count: int
    backlog_size: int
    breach_rate_trend: float
    breach_rate_delta: str
    breach_chart_data: List[SLABreachPoint]
    backlog_chart_data: List[SLABacklogPoint]

# EXISTING ANALYTICS SCHEMAS
class ResolutionBreakdown(BaseModel):
    type: str
    count: int

class TrendPoint(BaseModel):
    date: str
    count: Optional[int] = None
    breaches: Optional[int] = None

class AnalyticsResponse(BaseModel):
    total_tickets: int
    ai_resolved_count: int
    escalated_count: int
    avg_confidence: float
    avg_resolution_time: float
    sla_breaches: int
    backlog: int

    # 🔥 NEW FIELDS
    resolution_breakdown: List[ResolutionBreakdown]
    ticket_volume_trend: List[TrendPoint]
    sla_trend: List[TrendPoint]


class FAQCreateRequest(BaseModel):
    question: str
    answer: str


class FAQUpdateRequest(BaseModel):
    faq_id: str
    question: Optional[str] = None
    answer: Optional[str] = None


class ConfigUpdateRequest(BaseModel):
    confidence_threshold: Optional[float] = None
    emotion_check_enabled: Optional[bool] = None


# -------------------------------------------------
# 🔥 NEW: GET /admin/analytics/sla-detailed
# -------------------------------------------------
@router.get("/analytics/sla-detailed", response_model=SLADetailedResponse)
def sla_detailed_endpoint():
    """
    Returns high-fidelity metrics for the cinematic SLA dashboard.
    Includes historical breach and backlog trends.
    """
    try:
        return get_sla_detailed_metrics()
    except Exception as e:
        print(f"Error fetching SLA metrics: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to calculate detailed SLA metrics"
        )


# -------------------------------------------------
# GET /admin/analytics
# -------------------------------------------------
@router.get("/analytics", response_model=AnalyticsResponse)
def fetch_analytics():
    """
    Returns system-wide analytics for admin dashboard.
    """
    try:
        return get_system_analytics()
    except Exception as e:
        print(f"Error fetching analytics: {e}") # Debug log
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch analytics",
        )


# -------------------------------------------------
# GET /admin/analytics/tickets/trend
# -------------------------------------------------
@router.get("/analytics/tickets/trend")
def ticket_volume_trend():
    """
    Ticket volume over last 7 days.
    Used by Admin Analytics charts.
    """
    today = datetime.utcnow().date()
    result = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        next_day = day + timedelta(days=1)

        count = tickets_collection.count_documents(
            {
                "created_at": {
                    "$gte": datetime.combine(day, datetime.min.time()),
                    "$lt": datetime.combine(next_day, datetime.min.time()),
                }
            }
        )

        result.append(
            {
                "label": day.strftime("%a"),
                "tickets": count,
            }
        )

    return result


# -------------------------------------------------
# GET /admin/analytics/confidence-distribution
# -------------------------------------------------
@router.get("/analytics/confidence-distribution")
def confidence_distribution():
    """
    Confidence score buckets for AI-resolved tickets.
    """
    buckets = {
        "0–0.3": 0,
        "0.3–0.6": 0,
        "0.6–1.0": 0,
    }

    cursor = tickets_collection.find(
        {"confidence_score": {"$exists": True, "$ne": None}},
        {"confidence_score": 1},
    )

    for t in cursor:
        score = t.get("confidence_score")
        if score is None:
            continue
        if score < 0.3:
            buckets["0–0.3"] += 1
        elif score < 0.6:
            buckets["0.3–0.6"] += 1
        else:
            buckets["0.6–1.0"] += 1

    return [
        {"bucket": k, "count": v}
        for k, v in buckets.items()
    ]


# -------------------------------------------------
# 🔥 GET /admin/analytics/resolution-trend
# -------------------------------------------------
@router.get("/analytics/resolution-trend")
def resolution_trend_endpoint():
    """
    Returns AI vs Human resolution stats for charts.
    """
    try:
        return get_resolution_trend()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch resolution trend")


# -------------------------------------------------
# 🔥 GET /admin/analytics/escalation-trend
# -------------------------------------------------
@router.get("/analytics/escalation-trend")
def escalation_trend_endpoint():
    """
    Returns escalation rate percentage trend.
    """
    try:
        return get_escalation_trend()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch escalation trend")


# -------------------------------------------------
# 🔥 NEW: GET /admin/agents
# -------------------------------------------------
@router.get("/agents")
def fetch_all_agents():
    """
    Returns list of all agents.
    Used by Admin dashboard.
    """
    try:
        return get_all_agents()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch agents",
        )


# -------------------------------------------------
# FAQ MANAGEMENT
# -------------------------------------------------
@router.get("/faqs")
def fetch_faqs():
    try:
        return get_all_faqs()
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch FAQs",
        )


@router.post("/faqs")
def create_faq(payload: FAQCreateRequest):
    try:
        add_faq(
            question=payload.question,
            answer=payload.answer,
        )
        return {
            "status": "success",
            "message": "FAQ added successfully. Knowledge base updated.",
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to add FAQ",
        )


@router.put("/faqs")
def modify_faq(payload: FAQUpdateRequest):
    try:
        update_faq(
            faq_id=payload.faq_id,
            question=payload.question,
            answer=payload.answer,
        )
        return {
            "status": "success",
            "message": "FAQ updated successfully. Knowledge base refreshed.",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to update FAQ",
        )


# -------------------------------------------------
# POST /admin/config
# -------------------------------------------------
@router.post("/config")
def update_config(payload: ConfigUpdateRequest):
    if payload.confidence_threshold is not None:
        if not (0.0 <= payload.confidence_threshold <= 1.0):
            raise HTTPException(
                status_code=400,
                detail="Confidence threshold must be between 0.0 and 1.0",
            )

    try:
        update_system_config(payload.dict(exclude_none=True))
        return {
            "status": "success",
            "message": "System configuration updated successfully",
        }
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to update configuration",
        )