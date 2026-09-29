"""
Demo Connector — realistic simulated data in DEMO MODE.
Implements BaseConnector exactly like a real company connector would.
When DEMO_MODE=false, this is replaced by a real connector with zero frontend changes.
"""

import asyncio
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import AsyncGenerator, Dict, List, Optional
import structlog

from app.connectors.base import (
    BaseConnector, ConnectorStatus, ConnectorHealth,
    NormalizedEvent, NormalizedMetric
)
from app.core.config import settings

logger = structlog.get_logger()


# ─── Demo Data Constants ──────────────────────────────────────

DEMO_COMPANIES = [
    {"id": "trailmasters_india", "name": "TrailMasters India",  "icon": "🏔️", "color": "#4ade80"},
    {"id": "ecoroutes_network",  "name": "EcoRoutes Network",   "icon": "🌿", "color": "#34d399"},
    {"id": "wildexplore",        "name": "WildExplore",         "icon": "🦅", "color": "#38bdf8"},
    {"id": "naturehub",          "name": "NatureHub",           "icon": "🌳", "color": "#a3e635"},
    {"id": "adventureco",        "name": "AdventureCo",         "icon": "⛺", "color": "#f59e0b"},
    {"id": "summit_travels",     "name": "Summit Travels",      "icon": "🏕️", "color": "#c084fc"},
    {"id": "trailblazers_co",    "name": "TrailBlazers Co.",    "icon": "🔥", "color": "#f87171"},
]

DEMO_EVENT_TYPES = [
    {"type": "booking",          "label": "New Booking",         "icon": "🎫", "amount_range": (800, 12000)},
    {"type": "signup",           "label": "User Signup",         "icon": "👤", "amount_range": None},
    {"type": "campaign_click",   "label": "Campaign Click",      "icon": "🖱️", "amount_range": None},
    {"type": "review",           "label": "5-Star Review",       "icon": "⭐", "amount_range": None},
    {"type": "referral",         "label": "Referral Converted",  "icon": "🔄", "amount_range": (200, 1500)},
    {"type": "trail_completed",  "label": "Trail Completed",     "icon": "✅", "amount_range": None},
    {"type": "loyalty_upgrade",  "label": "Loyalty Tier Upgrade","icon": "🏆", "amount_range": None},
    {"type": "package_sale",     "label": "Package Sold",        "icon": "📦", "amount_range": (2000, 18000)},
    {"type": "cancellation",     "label": "Booking Cancelled",   "icon": "❌", "amount_range": (-5000, -500)},
    {"type": "checkout",         "label": "Checkout Started",    "icon": "🛒", "amount_range": None},
]

DEMO_LOCATIONS = [
    "Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai",
    "Kolkata", "Jaipur", "Shimla", "Manali", "Rishikesh", "Coorg",
    "Ooty", "Auli", "Spiti Valley", "Chopta", "Hampi",
]

DEMO_TRAILS = [
    "Western Ghats Trek", "Roopkund Trail", "Valley of Flowers",
    "Kedarkantha Peak", "Triund Trek", "Chopta Chandrashila",
    "Hampta Pass", "Bali Pass", "Sandakphu Trek", "Brahmatal Trail",
    "Pin Parvati Pass", "Goechala Trek", "Har Ki Dun",
]

# Base KPI state — drifts realistically over time
_kpi_state = {
    "total_users": 84320,
    "campaign_reach": 2_400_000,
    "promo_roi": 3.8,
    "retention_rate": 71.3,
    "nps_score": 67,
    "green_score": 88,
    "active_users": 623,
    "live_bookings": 28,
    "cpa": 812,
    "email_open_rate": 34.2,
    "revenue_today": 182_400,
    "revenue_per_second": 2.11,
    "events_per_minute": 142,
    "api_latency_ms": 84,
}


class DemoConnector(BaseConnector):
    """
    Demo data connector — labelled DEMO, realistic, structured exactly
    like a real connector. Replace with RealCompanyConnector to go live.

    DEMO MODE = true (controlled by DEMO_MODE env var)
    """

    IS_DEMO = True

    def __init__(self):
        super().__init__(
            connector_id="demo",
            config={"rate_per_minute": settings.DEMO_EVENT_RATE_PER_MINUTE}
        )
        self._running = False
        self._event_count = 0
        self._start_time = datetime.now(timezone.utc)

    async def connect(self) -> bool:
        self.log.info("demo_connector.connect")
        await asyncio.sleep(0.1)  # simulate async connection
        self._status = ConnectorStatus(
            health=ConnectorHealth.HEALTHY,
            latency_ms=0.1,
            last_sync=datetime.now(timezone.utc),
            is_demo=True,
            message="Demo mode — no real company data"
        )
        return True

    async def authenticate(self) -> bool:
        return True  # Demo needs no auth

    def _make_event(self) -> NormalizedEvent:
        company = random.choice(DEMO_COMPANIES)
        evt_type = random.choice(DEMO_EVENT_TYPES)
        amount = None
        if evt_type["amount_range"]:
            lo, hi = evt_type["amount_range"]
            amount = round(random.uniform(lo, hi), 2)

        return NormalizedEvent(
            id=str(uuid.uuid4()),
            type=evt_type["type"],
            label=evt_type["label"],
            icon=evt_type["icon"],
            company_id=company["id"],
            company_name=company["name"],
            company_icon=company["icon"],
            company_color=company["color"],
            source="demo",
            occurred_at=datetime.now(timezone.utc),
            amount=amount,
            currency="INR",
            customer_id=f"USR{random.randint(10000, 99999)}",
            location=random.choice(DEMO_LOCATIONS),
            trail=random.choice(DEMO_TRAILS),
            metadata={"session_id": str(uuid.uuid4())[:8]},
            is_demo=True,
        )

    async def fetch_events(self, limit: int = 50) -> List[NormalizedEvent]:
        return [self._make_event() for _ in range(min(limit, 30))]

    async def fetch_metrics(self) -> Dict[str, NormalizedMetric]:
        """Return drifted KPI metrics — realistic movement every call"""
        global _kpi_state
        now = datetime.now(timezone.utc)

        # Realistic drift
        _kpi_state["total_users"]    += random.randint(0, 8)
        _kpi_state["campaign_reach"] += random.randint(0, 3000)
        _kpi_state["promo_roi"]       = round(min(6.5, max(2.5, _kpi_state["promo_roi"] + random.uniform(-0.03, 0.04))), 2)
        _kpi_state["retention_rate"]  = round(min(85, max(60, _kpi_state["retention_rate"] + random.uniform(-0.15, 0.2))), 1)
        _kpi_state["nps_score"]      += 1 if random.random() > 0.85 else 0
        _kpi_state["active_users"]    = random.randint(320, 920)
        _kpi_state["live_bookings"]   = random.randint(12, 68)
        _kpi_state["cpa"]             = max(650, min(980, _kpi_state["cpa"] + random.randint(-8, 8)))
        _kpi_state["email_open_rate"] = round(min(48, max(25, _kpi_state["email_open_rate"] + random.uniform(-0.3, 0.35))), 1)
        _kpi_state["revenue_today"]  += random.randint(800, 5000)
        _kpi_state["api_latency_ms"]  = round(random.uniform(45, 180), 1)
        _kpi_state["events_per_minute"] = random.randint(80, 220)

        metrics = {}
        for name, value in _kpi_state.items():
            unit_map = {
                "promo_roi": "×", "retention_rate": "%", "email_open_rate": "%",
                "green_score": "/100", "api_latency_ms": "ms",
                "revenue_today": "₹", "revenue_per_second": "₹/s",
            }
            metrics[name] = NormalizedMetric(
                company_id="greentrail",
                source="demo",
                name=name,
                value=value,
                unit=unit_map.get(name),
                recorded_at=now,
                is_demo=True,
            )
        return metrics

    async def subscribe(self) -> AsyncGenerator[NormalizedEvent, None]:
        """
        Continuously yield events at the configured rate.
        This is the hot path — called by the realtime engine.
        """
        self._running = True
        rate = self.config.get("rate_per_minute", 120)
        interval = 60.0 / rate  # seconds between events

        self.log.info("demo_connector.subscribe_start", events_per_minute=rate)
        while self._running:
            await asyncio.sleep(interval + random.uniform(-0.5, 0.5))  # jitter
            event = self._make_event()
            self._event_count += 1
            self._status.records_processed += 1
            self._status.last_sync = datetime.now(timezone.utc)
            yield event

    async def health_check(self) -> ConnectorStatus:
        uptime = (datetime.now(timezone.utc) - self._start_time).total_seconds()
        self._status.latency_ms = 0.5
        self._status.last_sync = datetime.now(timezone.utc)
        self._status.message = f"Demo running — {self._event_count} events generated, uptime {int(uptime)}s"
        return self._status

    async def disconnect(self) -> None:
        self._running = False
        self.log.info("demo_connector.disconnected")
