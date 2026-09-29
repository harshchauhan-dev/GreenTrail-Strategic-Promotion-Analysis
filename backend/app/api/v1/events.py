"""
Events Stream Router
"""

from fastapi import APIRouter
from typing import Optional

router = APIRouter()


@router.get("/")
async def get_recent_events(limit: int = 50, category: Optional[str] = None):
    sample_events = [
        {"id": "evt-1", "category": "booking", "title": "Bulk Cargo Dispatch Booked", "amount": 54000, "source": "Company REST API", "timestamp": "14:20:10"},
        {"id": "evt-2", "category": "transaction", "title": "Corporate Route Settlement Confirmed", "amount": 88500, "source": "Razorpay Webhook", "timestamp": "14:19:42"},
        {"id": "evt-3", "category": "campaign", "title": "Instagram Ad Conversion Triggered", "amount": 12400, "source": "Meta Ads Ingestion", "timestamp": "14:19:15"},
        {"id": "evt-4", "category": "anomaly", "title": "Telemetry Health Scan Completed (0 breaches)", "source": "Anomaly Agent", "timestamp": "14:18:50"},
    ]
    if category and category != "all":
        sample_events = [e for e in sample_events if e["category"] == category]
    return sample_events
