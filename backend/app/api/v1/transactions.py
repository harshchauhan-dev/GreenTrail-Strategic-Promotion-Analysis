"""
Transactions Router
"""

from fastapi import APIRouter
from typing import List

router = APIRouter()


@router.get("/")
async def list_transactions():
    return [
        {"id": "TX-9901", "date": "Today, 14:20", "amount": 42500, "status": "Settled", "desc": "Corporate Route Booking"},
        {"id": "TX-9844", "date": "Yesterday, 11:15", "amount": 88000, "status": "Settled", "desc": "Enterprise Bulk Dispatch"},
        {"id": "TX-9721", "date": "3 days ago", "amount": 34200, "status": "Settled", "desc": "Express Transit Priority"},
    ]
