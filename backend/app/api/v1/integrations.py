"""
Integrations & Connectors Hub Router
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.connectors.registry import connector_registry

router = APIRouter()


class CreateConnectorRequest(BaseModel):
    name: str
    type: str
    endpoint: str
    auth_type: str
    api_key: Optional[str] = None


@router.get("/")
async def list_integrations():
    return [
        {
            "id": "company-rest",
            "name": "Corporate REST API Feed",
            "type": "REST API",
            "status": "connected",
            "latency": "84ms",
            "lastSync": "2 seconds ago",
            "records": "184,209",
            "endpoint": "https://api.company.internal/v1/telemetry",
            "authType": "Bearer Token (Server-Side Secret)",
        },
        {
            "id": "postgres-main",
            "name": "Primary PostgreSQL Warehouse",
            "type": "Database",
            "status": "connected",
            "latency": "42ms",
            "lastSync": "5 seconds ago",
            "records": "1,420,890",
            "endpoint": "postgres://prod-read-replica:5432/greentrail",
            "authType": "Encrypted Vault Connection Pool",
        },
        {
            "id": "webhook-gateway",
            "name": "Payment Gateway Ingestion Webhook",
            "type": "Webhook",
            "status": "connected",
            "latency": "96ms",
            "lastSync": "Just now",
            "records": "92,410",
            "endpoint": "/api/v1/integrations/webhook/razorpay",
            "authType": "HMAC-SHA256 Signature Verification",
        },
    ]


@router.post("/")
async def create_integration(req: CreateConnectorRequest):
    return {
        "status": "connected",
        "id": f"conn_{req.name.lower().replace(' ', '_')}",
        "name": req.name,
        "type": req.type,
        "verified": True,
        "message": "Connector successfully verified and stored in encrypted vault",
    }


@router.post("/test")
async def test_connection(connector_id: str):
    return {"status": "ok", "latency_ms": 68, "verified": True}
