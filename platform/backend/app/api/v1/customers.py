"""
Customers & Customer 360 Router
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional

router = APIRouter()

CUSTOMERS = [
    {
        "id": "10392",
        "name": "Apex Global Holdings",
        "email": "procurement@apexholdings.in",
        "company": "Apex Global Holdings Ltd",
        "tier": "Enterprise",
        "ltv": 482000,
        "total_bookings": 38,
        "churn_risk": 0.08,
        "last_active": "6 mins ago",
    },
    {
        "id": "10393",
        "name": "Zenith Logistics India",
        "email": "fleet@zenithlogistics.in",
        "company": "Zenith Freight Solutions",
        "tier": "Growth",
        "ltv": 240000,
        "total_bookings": 19,
        "churn_risk": 0.38,
        "last_active": "2 days ago",
    },
    {
        "id": "10394",
        "name": "Titan Express Couriers",
        "email": "dispatch@titanexpress.com",
        "company": "Titan Translogistics",
        "tier": "Enterprise",
        "ltv": 620000,
        "total_bookings": 52,
        "churn_risk": 0.04,
        "last_active": "Just now",
    },
    {
        "id": "10395",
        "name": "Indus Supply Chain",
        "email": "ops@indussupply.in",
        "company": "Indus Supply Network",
        "tier": "Growth",
        "ltv": 185000,
        "total_bookings": 14,
        "churn_risk": 0.16,
        "last_active": "35 mins ago",
    },
]


@router.get("/")
async def list_customers():
    return CUSTOMERS


@router.get("/{customer_id}")
async def get_customer(customer_id: str):
    cust = next((c for c in CUSTOMERS if c["id"] == customer_id), None)
    if not cust:
        # Fallback profile
        return {
            "id": customer_id,
            "name": f"Enterprise Account #{customer_id}",
            "email": f"account{customer_id}@client.internal",
            "company": "Enterprise Logistics Client",
            "tier": "Enterprise",
            "ltv": 340000,
            "total_bookings": 22,
            "churn_risk": 0.14,
            "last_active": "10 mins ago",
        }
    return cust
