"""
API v1 Router Package
Exports all routers for main.py inclusion
"""

from app.api.v1 import (
    auth, company, customers, transactions,
    campaigns, metrics, events, alerts,
    insights, forecast, integrations,
    resources, ai_router, reports, system, data_explorer, optimizer
)

__all__ = [
    "auth", "company", "customers", "transactions",
    "campaigns", "metrics", "events", "alerts",
    "insights", "forecast", "integrations",
    "resources", "ai_router", "reports", "system", "data_explorer", "optimizer"
]
