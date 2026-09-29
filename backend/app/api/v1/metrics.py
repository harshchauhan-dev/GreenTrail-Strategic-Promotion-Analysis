"""
Metrics & Telemetry Router
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_current_metrics():
    return {
        "revenueLakhs": 32.42,
        "activeUsers": 8421,
        "bookings": 1284,
        "eventsPerSec": 184,
        "latencyMs": 82,
        "freshnessSeconds": 1.8,
        "connectionStatus": "connected",
        "demoMode": True,
    }
