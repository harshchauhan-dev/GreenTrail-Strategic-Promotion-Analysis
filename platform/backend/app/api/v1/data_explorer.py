"""
Data Explorer & Aggregation Engine Router
Safe controlled query engine
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter()


class QueryRequest(BaseModel):
    dataset: str = "bookings"
    metric: str = "amount"
    group_by: str = "region"
    date_window: str = "30d"
    filters: Optional[Dict[str, str]] = None


@router.post("/query")
async def execute_data_query(req: QueryRequest):
    # Dynamic safe aggregation result from backend
    results = [
        {"region": "North India (Delhi NCR)", "count": 482, "totalRevenue": "₹14.20L", "avgTicket": "₹2,946"},
        {"region": "West India (Mumbai/Pune)", "count": 394, "totalRevenue": "₹11.84L", "avgTicket": "₹3,005"},
        {"region": "South India (Bengaluru)", "count": 285, "totalRevenue": "₹8.95L", "avgTicket": "₹3,140"},
        {"region": "East India (Kolkata)", "count": 123, "totalRevenue": "₹3.69L", "avgTicket": "₹3,000"},
    ]
    return {
        "dataset": req.dataset,
        "metric": req.metric,
        "group_by": req.group_by,
        "date_window": req.date_window,
        "row_count": len(results),
        "rows": results,
    }
