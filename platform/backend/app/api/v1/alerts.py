"""
Alerts Router
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class AcknowledgeRequest(BaseModel):
    alert_id: str


@router.get("/")
async def list_alerts():
    return [
        {
            "id": "al-1",
            "severity": "warning",
            "title": "Meta Ads Ingestion API Latency Delayed",
            "message": "Marketing API response time peaked at 320ms (threshold: 250ms). Fallback retry queue initiated.",
            "source": "Marketing Connector",
            "timestamp": "4 mins ago",
            "acknowledged": False,
        },
        {
            "id": "al-2",
            "severity": "info",
            "title": "PostgreSQL WAL Replication Synced",
            "message": "Replica node caught up with master within 18ms SLA. 14,200 records normalized into canonical schema.",
            "source": "Database Engine",
            "timestamp": "14 mins ago",
            "acknowledged": True,
        },
        {
            "id": "al-3",
            "severity": "critical",
            "title": "Sudden Booking Drop Detected on Stale Connector",
            "message": "Secondary MySQL booking feed logged zero events for 120 seconds. Automatic reconnect triggered.",
            "source": "MySQL Gateway",
            "timestamp": "32 mins ago",
            "acknowledged": False,
        },
    ]


@router.post("/acknowledge")
async def acknowledge_alert(req: AcknowledgeRequest):
    return {"status": "ok", "alert_id": req.alert_id, "acknowledged": True}
