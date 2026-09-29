"""
GreenTrail Live Intelligence Platform — FastAPI Main Application
Production-grade backend with WebSocket, REST API v1, Auth, and real-time engine
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog
import uvicorn

from app.core.config import settings
from app.core.logging import setup_logging
from app.database.engine import create_db_tables
from app.realtime.manager import realtime_manager
from app.connectors.registry import connector_registry
from app.agents.scheduler import agent_scheduler

# Routes
from app.api.v1 import (
    auth, company, customers, transactions,
    campaigns, metrics, events, alerts,
    insights, forecast, integrations,
    resources, ai_router, reports, system, data_explorer, optimizer
)
from app.realtime import websocket_router

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle manager"""
    setup_logging()
    logger.info("greentrail.startup", env=settings.APP_ENV, demo_mode=settings.DEMO_MODE)

    # Initialize database tables
    await create_db_tables()

    # Initialize connector registry (demo or real)
    await connector_registry.initialize()
    logger.info("connectors.initialized", count=len(connector_registry.connectors))

    # Start realtime manager (WebSocket broker)
    await realtime_manager.start()

    # Start agent scheduler (anomaly detection, forecasting, etc.)
    await agent_scheduler.start()

    logger.info("greentrail.ready", url=f"http://localhost:{settings.PORT}")
    yield

    # Graceful shutdown
    logger.info("greentrail.shutdown")
    await agent_scheduler.stop()
    await realtime_manager.stop()
    await connector_registry.shutdown()


app = FastAPI(
    title="GreenTrail Intelligence API",
    description="Real-time business intelligence platform API",
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ─── API Routes v1 ───────────────────────────────────────────
prefix = "/api/v1"
app.include_router(auth.router,         prefix=f"{prefix}/auth",         tags=["Auth"])
app.include_router(company.router,      prefix=f"{prefix}/company",      tags=["Company"])
app.include_router(customers.router,    prefix=f"{prefix}/customers",    tags=["Customers"])
app.include_router(transactions.router, prefix=f"{prefix}/transactions", tags=["Transactions"])
app.include_router(campaigns.router,    prefix=f"{prefix}/campaigns",    tags=["Campaigns"])
app.include_router(metrics.router,      prefix=f"{prefix}/metrics",      tags=["Metrics"])
app.include_router(events.router,       prefix=f"{prefix}/events",       tags=["Events"])
app.include_router(alerts.router,       prefix=f"{prefix}/alerts",       tags=["Alerts"])
app.include_router(insights.router,     prefix=f"{prefix}/insights",     tags=["Insights"])
app.include_router(forecast.router,     prefix=f"{prefix}/forecast",     tags=["Forecast"])
app.include_router(integrations.router, prefix=f"{prefix}/integrations", tags=["Integrations"])
app.include_router(resources.router,    prefix=f"{prefix}/resources",    tags=["Resources"])
app.include_router(ai_router.router,    prefix=f"{prefix}/ai",           tags=["AI"])
app.include_router(reports.router,      prefix=f"{prefix}/reports",      tags=["Reports"])
app.include_router(data_explorer.router,prefix=f"{prefix}/data",         tags=["Data Explorer"])
app.include_router(optimizer.router,    prefix=f"{prefix}/optimizer",    tags=["Optimizer"])
app.include_router(system.router,       prefix=f"{prefix}/system",       tags=["System"])

# ─── WebSocket ───────────────────────────────────────────────
app.include_router(websocket_router.router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "demo_mode": settings.DEMO_MODE,
        "connectors": connector_registry.health_summary(),
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_config=None,  # Use structlog
    )
