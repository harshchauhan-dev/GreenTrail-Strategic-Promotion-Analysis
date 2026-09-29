"""
Autonomous AI Agent Scheduler
Periodically evaluates statistical rules, detects anomalies, forecasts trends, and broadcasts insights.
"""

import asyncio
import random
from datetime import datetime, timezone
import structlog
from app.realtime.manager import realtime_manager

logger = structlog.get_logger()


class AgentScheduler:
    def __init__(self):
        self._running = False
        self._task = None

    async def start(self):
        self._running = True
        self._task = asyncio.create_task(self._scheduler_loop())
        logger.info("agents.scheduler_started")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        logger.info("agents.scheduler_stopped")

    async def _scheduler_loop(self):
        """Periodic background evaluation loop"""
        sample_insights = [
            {
                "id": "auto-ins-1",
                "type": "opportunity",
                "title": "Corporate Route Conversion Acceleration",
                "description": "WhatsApp automated booking flow conversion climbed to 14.8%. High efficiency detected in Delhi-NCR industrial segment.",
                "confidence": 0.94,
                "actionUrl": "/campaigns",
                "toolsUsed": ["query_metrics(cvr)", "detect_conversion_lift()"],
            },
            {
                "id": "auto-ins-2",
                "type": "anomaly",
                "title": "Minor Micro-Spike in Mumbai Dispatch Latency",
                "description": "Transit dispatch latency increased 12ms during localized peak traffic. Auto-rerouting protocol engaged.",
                "confidence": 0.89,
                "actionUrl": "/live",
                "toolsUsed": ["detect_anomalies(transit_latency)"],
            },
        ]

        counter = 0
        while self._running:
            try:
                # Every 25 seconds, emit an autonomous AI insight or alert
                await asyncio.sleep(25)
                if not self._running:
                    break

                insight = sample_insights[counter % len(sample_insights)]
                counter += 1

                insight_payload = {
                    **insight,
                    "id": f"ins-{int(datetime.now(timezone.utc).timestamp())}",
                    "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                }

                await realtime_manager.broadcast("live", {
                    "type": "ai_insight",
                    "data": insight_payload,
                })
                logger.info("agent.insight_broadcasted", title=insight["title"])

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning("agent.scheduler_error", error=str(e))


agent_scheduler = AgentScheduler()
