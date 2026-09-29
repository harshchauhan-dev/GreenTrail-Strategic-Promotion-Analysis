"""
FastAPI WebSocket Router
Exposes /ws/live, /ws/alerts, /ws/activity, and /ws/presence endpoints.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog
from app.realtime.manager import realtime_manager

logger = structlog.get_logger()
router = APIRouter()


@router.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await realtime_manager.connect(websocket, channel="live")
    try:
        # Send initial snapshot upon connection
        init_packet = {
            "type": "init",
            "data": {
                "kpi": {
                    "revenueLakhs": 32.42,
                    "activeUsers": 8421,
                    "bookings": 1284,
                    "eventsPerSec": 184,
                    "latencyMs": 82,
                },
                "status": "connected",
            },
        }
        await websocket.send_json(init_packet)

        while True:
            # Keep receiving client requests or pings
            data = await websocket.receive_text()
            # If client requests forced refresh
            if "sync" in data:
                await websocket.send_json({"type": "sync_ack", "status": "ok"})
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket, channel="live")
    except Exception as e:
        logger.warning("ws.live_error", error=str(e))
        realtime_manager.disconnect(websocket, channel="live")


@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await realtime_manager.connect(websocket, channel="alerts")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket, channel="alerts")


@router.websocket("/ws/activity")
async def websocket_activity_endpoint(websocket: WebSocket):
    await realtime_manager.connect(websocket, channel="activity")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket, channel="activity")


@router.websocket("/ws/presence")
async def websocket_presence_endpoint(websocket: WebSocket):
    await realtime_manager.connect(websocket, channel="presence")
    try:
        # Broadcast presence
        await realtime_manager.broadcast("presence", {
            "type": "presence",
            "data": {"users": ["Harsh (Admin)", "Analyst 2", "Data Ops"]},
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        realtime_manager.disconnect(websocket, channel="presence")
