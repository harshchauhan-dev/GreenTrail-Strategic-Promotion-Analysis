"""
Connector Base Interface — every data connector must implement this.
Follows an interface pattern so Demo and Real connectors are interchangeable.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator, Dict, List, Optional, Callable
from datetime import datetime
from enum import Enum
import structlog

logger = structlog.get_logger()


class ConnectorHealth(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    CONNECTING = "connecting"
    DISABLED = "disabled"


@dataclass
class ConnectorStatus:
    health: ConnectorHealth
    latency_ms: Optional[float] = None
    last_sync: Optional[datetime] = None
    records_processed: int = 0
    error_count: int = 0
    last_error: Optional[str] = None
    message: Optional[str] = None
    is_demo: bool = False


@dataclass
class NormalizedEvent:
    """Canonical event format — every connector must produce these"""
    id: str
    type: str                          # booking | signup | review | refund | etc.
    label: str
    icon: str
    company_id: str
    company_name: str
    company_icon: str
    company_color: str
    source: str                        # connector ID that produced this
    occurred_at: datetime
    amount: Optional[float] = None
    currency: str = "INR"
    customer_id: Optional[str] = None
    location: Optional[str] = None
    trail: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    is_demo: bool = False


@dataclass
class NormalizedMetric:
    """Canonical KPI snapshot"""
    company_id: str
    source: str
    name: str
    value: float
    unit: Optional[str] = None
    recorded_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)
    is_demo: bool = False


class BaseConnector(ABC):
    """
    Abstract base class for all GreenTrail data connectors.

    To connect a new company system:
    1. Create a new class inheriting from BaseConnector
    2. Implement all abstract methods
    3. Register in ConnectorRegistry
    4. The frontend and data engine will work automatically
    """

    def __init__(self, connector_id: str, config: Dict[str, Any]):
        self.connector_id = connector_id
        self.config = config
        self._status = ConnectorStatus(health=ConnectorHealth.CONNECTING)
        self._event_callbacks: List[Callable[[NormalizedEvent], None]] = []
        self._metric_callbacks: List[Callable[[NormalizedMetric], None]] = []
        self.log = logger.bind(connector=connector_id)

    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to the data source. Return True on success."""
        pass

    @abstractmethod
    async def authenticate(self) -> bool:
        """Perform authentication. Return True if authenticated."""
        pass

    @abstractmethod
    async def fetch_events(self, limit: int = 50) -> List[NormalizedEvent]:
        """Fetch recent events from this data source."""
        pass

    @abstractmethod
    async def fetch_metrics(self) -> Dict[str, NormalizedMetric]:
        """Fetch current KPI metrics from this data source."""
        pass

    @abstractmethod
    async def subscribe(self) -> AsyncGenerator[NormalizedEvent, None]:
        """
        Subscribe to real-time event stream from this source.
        Yields NormalizedEvent objects as they arrive.
        """
        pass

    @abstractmethod
    async def health_check(self) -> ConnectorStatus:
        """Check connection health. Must not throw — return FAILED status on error."""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Clean up resources."""
        pass

    # ─── Common Methods ───────────────────────────────────────

    def on_event(self, callback: Callable[[NormalizedEvent], None]) -> None:
        """Register a callback to be called when a new event arrives"""
        self._event_callbacks.append(callback)

    def on_metric(self, callback: Callable[[NormalizedMetric], None]) -> None:
        """Register a callback for metric updates"""
        self._metric_callbacks.append(callback)

    async def _emit_event(self, event: NormalizedEvent) -> None:
        for cb in self._event_callbacks:
            try:
                await cb(event) if hasattr(cb, '__await__') else cb(event)
            except Exception as e:
                self.log.error("connector.event_callback_error", error=str(e))

    async def _emit_metric(self, metric: NormalizedMetric) -> None:
        for cb in self._metric_callbacks:
            try:
                await cb(metric) if hasattr(cb, '__await__') else cb(metric)
            except Exception as e:
                self.log.error("connector.metric_callback_error", error=str(e))

    @property
    def status(self) -> ConnectorStatus:
        return self._status

    def is_healthy(self) -> bool:
        return self._status.health == ConnectorHealth.HEALTHY
