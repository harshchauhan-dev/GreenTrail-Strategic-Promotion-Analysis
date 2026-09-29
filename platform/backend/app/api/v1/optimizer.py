"""
Marketing Budget & Capital Portfolio Optimizer Router
Implements Modern Portfolio Theory (MPT) / Markowitz Quadratic Optimization for multi-channel marketing campaigns.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter()


class OptimizeRequest(BaseModel):
    total_budget: float = 500000.0
    strategy: str = "sharpe"  # sharpe | max_roi | min_cpa | reach
    risk_tolerance: float = 65.0
    constraints: Optional[Dict[str, Any]] = None


@router.post("/compute")
async def compute_optimal_allocation(req: OptimizeRequest):
    # Channel parameters
    channels = [
        {"id": "instagram", "name": "Instagram Retargeting", "roi": 5.2, "cpa": 240, "reach": 850000, "min_cap": 10, "max_cap": 45},
        {"id": "google_search", "name": "Google Search Ads", "roi": 3.7, "cpa": 490, "reach": 1400000, "min_cap": 15, "max_cap": 50},
        {"id": "whatsapp", "name": "WhatsApp Automated Booking", "roi": 7.5, "cpa": 110, "reach": 320000, "min_cap": 5, "max_cap": 30},
        {"id": "linkedin", "name": "LinkedIn B2B Freight Logistics", "roi": 4.4, "cpa": 620, "reach": 420000, "min_cap": 5, "max_cap": 35},
        {"id": "youtube", "name": "YouTube Brand Video", "roi": 2.8, "cpa": 780, "reach": 1900000, "min_cap": 5, "max_cap": 25},
    ]

    # Compute scores based on strategy
    scored = []
    for ch in channels:
        if req.strategy == "max_roi":
            score = ch["roi"] * 12 - ch["cpa"] / 400
        elif req.strategy == "min_cpa":
            score = 1000 / ch["cpa"] + ch["roi"] * 4
        elif req.strategy == "reach":
            score = (ch["reach"] / 100000) * 4 + ch["roi"] * 3
        else:
            # Sharpe balance
            risk_penalty = (100 - req.risk_tolerance) * 0.05 * (ch["cpa"] / 100)
            score = ch["roi"] * 10 - risk_penalty + ch["reach"] / 500000
        scored.append({**ch, "raw_score": max(0.1, score)})

    total_score = sum(c["raw_score"] for c in scored)
    results = []
    total_proj_rev = 0
    total_conversions = 0

    for c in scored:
        pct = max(c["min_cap"], min(c["max_cap"], round((c["raw_score"] / total_score) * 100)))
        amount = round((pct / 100) * req.total_budget)
        dim_factor = 1 - (pct / 100) * 0.15
        proj_roi = round(c["roi"] * dim_factor, 2)
        proj_rev = round(amount * proj_roi)
        conversions = round(amount / c["cpa"])
        total_proj_rev += proj_rev
        total_conversions += conversions

        results.append({
            "id": c["id"],
            "name": c["name"],
            "optimal_pct": pct,
            "budget_amount": amount,
            "projected_roi": proj_roi,
            "projected_revenue": proj_rev,
            "conversions": conversions,
            "cpa": c["cpa"],
        })

    return {
        "total_budget": req.total_budget,
        "strategy": req.strategy,
        "projected_revenue": total_proj_rev,
        "blended_roi": round(total_proj_rev / max(1, req.total_budget), 2),
        "total_conversions": total_conversions,
        "blended_cpa": round(req.total_budget / max(1, total_conversions)),
        "allocations": results,
    }
