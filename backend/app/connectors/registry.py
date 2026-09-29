"""
Connector Registry — manages active connectors and bridges ingestion with the realtime engine.
"""

from typing import Dict, Any, List
import asyncio
import structlog
from app.connectors.base import BaseConnector, ConnectorStatus
from app.connectors.demo import DemoConnector
from app.realtime.manager import realtime_manager
from app.core.config import settings

logger = structlog.get_logger()


class ConnectorRegistry:
    def __init__(self):
        self.connectors: Dict[str, BaseConnector] = {}
        self._ingestion_task = None
        self._running = False

    async def initialize(self):
        """Initialize active connectors based on settings (demo vs real)"""
        self._running = True

        if settings.DEMO_MODE:
            demo_conn = DemoConnector()
            await demo_conn.connect()
            self.connectors["demo"] = demo_conn
            logger.info("connector.registered", name="demo", is_demo=True)

        # Start continuous ingestion pipeline
        self._ingestion_task = asyncio.create_task(self._run_ingestion_loop())

    async def shutdown(self):
        """Disconnect all connectors and cancel ingestion background task"""
        self._running = False
        if self._ingestion_task:
            self._ingestion_task.cancel()
        for name, conn in self.connectors.items():
            await conn.disconnect()
        self.connectors.clear()

    async def _run_ingestion_loop(self):
        """Hot loop: subscribes to active connector streams and broadcasts normalized events"""
        logger.info("connector.ingestion_loop_started")
        demo_conn = self.connectors.get("demo")
        if not demo_conn:
            return

        try:
            async for event in demo_conn.subscribe():
                if not self._running:
                    break

                # 1. Broadcast normalized event over WebSocket
                event_dict = {
                    "id": event.id,
                    "category": event.type,
                    "title": f"{event.company_name}: {event.label}",
                    "amount": event.amount,
                    "source": event.source,
                    "timestamp": event.occurred_at.strftime("%H:%M:%S"),
                }
                await realtime_manager.broadcast("live", {
                    "type": "live_event",
                    "data": event_dict,
                })

                # 2. Periodically fetch and broadcast drifted metrics
                if demo_conn._event_count % 3 == 0:
                    metrics = await demo_conn.fetch_metrics()
                    kpi_update = {
                        "revenueLakhs": round(metrics["revenue_today"].value / 100000, 2),
                        "activeUsers": int(metrics["active_users"].value),
                        "bookings": int(metrics["live_bookings"].value),
                        "eventsPerSec": int(metrics["events_per_minute"].value / 60),
                        "latencyMs": int(metrics["api_latency_ms"].value),
                    }
                    await realtime_manager.broadcast("live", {
                        "type": "kpi_update",
                        "data": kpi_update,
                    })

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error("connector.ingestion_error", error=str(e))

    def health_summary(self) -> Dict[str, Any]:
        """Return health status summary for all connectors"""
        summary = {}
        for name, conn in self.connectors.items():
            summary[name] = {
                "health": conn.status.health.value,
                "latency_ms": conn.status.latency_ms,
                "records_processed": conn.status.records_processed,
                "is_demo": getattr(conn, "IS_DEMO", False),
            }
        return summary


connector_registry = ConnectorRegistry()
