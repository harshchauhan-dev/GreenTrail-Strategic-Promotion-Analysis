"""
Realtime WebSocket Manager
Handles connection pooling, channel-based pub/sub, heartbeat pings, and event broadcasting.
"""

from typing import Dict, Set, Any
from fastapi import WebSocket
import structlog
import asyncio
import json

logger = structlog.get_logger()


class RealtimeManager:
    def __init__(self):
        # Channel -> set of WebSockets
        self.channels: Dict[str, Set[WebSocket]] = {
            "live": set(),
            "alerts": set(),
            "activity": set(),
            "presence": set(),
        }
        self.running = False
        self._ping_task = None

    async def start(self):
        """Start background heartbeat loop"""
        self.running = True
        self._ping_task = asyncio.create_task(self._heartbeat_loop())
        logger.info("realtime.manager_started")

    async def stop(self):
        """Gracefully disconnect all active websockets"""
        self.running = False
        if self._ping_task:
            self._ping_task.cancel()
        for channel, sockets in self.channels.items():
            for ws in list(sockets):
                try:
                    await ws.close()
                except Exception:
                    pass
            sockets.clear()
        logger.info("realtime.manager_stopped")

    async def connect(self, websocket: WebSocket, channel: str = "live"):
        """Register a new websocket connection"""
        await websocket.accept()
        if channel not in self.channels:
            self.channels[channel] = set()
        self.channels[channel].add(websocket)
        logger.info("ws.client_connected", channel=channel, active_clients=len(self.channels[channel]))

    def disconnect(self, websocket: WebSocket, channel: str = "live"):
        """Remove a websocket connection on disconnect"""
        if channel in self.channels and websocket in self.channels[channel]:
            self.channels[channel].remove(websocket)
            logger.info("ws.client_disconnected", channel=channel, remaining=len(self.channels[channel]))

    async def broadcast(self, channel: str, message: Dict[str, Any]):
        """Broadcast JSON payload to all active clients in channel"""
        if channel not in self.channels:
            return

        dead_sockets = set()
        payload = json.dumps(message)

        for ws in self.channels[channel]:
            try:
                await ws.send_text(payload)
            except Exception:
                dead_sockets.add(ws)

        for dead in dead_sockets:
            self.channels[channel].discard(dead)

    async def _heartbeat_loop(self):
        """Send periodic ping to keep connections alive and provide latency telemetry"""
        while self.running:
            try:
                await asyncio.sleep(15)
                ping_msg = {
                    "type": "ping",
                    "timestamp": asyncio.get_event_loop().time(),
                }
                for ch in list(self.channels.keys()):
                    await self.broadcast(ch, ping_msg)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning("realtime.heartbeat_error", error=str(e))


realtime_manager = RealtimeManager()
