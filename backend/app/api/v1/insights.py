"""
AI Insights Router
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_insights():
    return [
        {
            "id": "ins-1",
            "type": "anomaly",
            "title": "Localized Booking Spike in North India Corridor",
            "description": "Continuous ingestion detected a 34% velocity increase in Delhi-Jaipur industrial bookings over the past 45 minutes. Correlated with the active WhatsApp automated booking campaign.",
            "timestamp": "3 mins ago",
            "confidence": 0.94,
            "actionUrl": "/live",
            "toolsUsed": ["query_telemetry()", "detect_anomalies(corridor_velocity)"],
        },
        {
            "id": "ins-2",
            "type": "opportunity",
            "title": "Instagram Ad Retargeting Outperforming Baseline",
            "description": "Campaign ROI reached 5.2x with CAC dropping to ₹240. Recommendation: Reallocate ₹40,000 from underperforming Search ad groups to capture weekend peak demand.",
            "timestamp": "12 mins ago",
            "confidence": 0.91,
            "actionUrl": "/campaigns",
            "toolsUsed": ["get_campaigns()", "calculate_cac_ltv()"],
        },
        {
            "id": "ins-3",
            "type": "trend",
            "title": "Enterprise Retention Trajectory Upward",
            "description": "Overall churn risk decreased 1.4% following proactive SLA notifications. Enterprise cohort expansion now projects at +16.8% for the next 30-day reporting cycle.",
            "timestamp": "24 mins ago",
            "confidence": 0.88,
            "actionUrl": "/forecast",
            "toolsUsed": ["predict_churn(ml_xgboost)", "get_customer_cohorts()"],
        },
    ]
