"""
Company 360° Operations Router
"""

from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter()


@router.get("/")
async def get_company_overview():
    return {
        "company": {
            "name": "GreenTrail Technologies Pvt. Ltd.",
            "cin": "U72900MH2023PTC394821",
            "hq": "Mumbai, Maharashtra, India",
            "active_corridors": 14,
            "connected_sources": 12,
        },
        "financials": {
            "revenue_today_lakhs": 32.42,
            "monthly_run_rate_cr": 0.97,
            "arr_cr": 3.88,
            "gross_margin_percent": 78.4,
            "mom_growth_percent": 14.2,
        },
        "operations": {
            "active_users": 8421,
            "daily_bookings": 1284,
            "fulfillment_rate_percent": 98.9,
            "avg_support_sla_min": 4.2,
        },
        "connectors_health": {
            "active_count": 6,
            "status": "operational",
            "p95_latency_ms": 82,
        },
    }
