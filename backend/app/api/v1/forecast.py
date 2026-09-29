"""
Forecast Router
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_forecast(horizon: str = "30d"):
    forecasts = {
        "30d": {
            "projectedRevenue": "₹48.60L",
            "projectedBookings": "1,840",
            "confidence": "94.2%",
            "growthRate": "+16.8%",
            "keyDriver": "Instagram & WhatsApp retargeting campaigns",
            "scenarios": {
                "bull": "₹53.20L (+27%)",
                "base": "₹48.60L (+16.8%)",
                "bear": "₹42.10L (+4.1%)",
            },
        },
        "60d": {
            "projectedRevenue": "₹1.04 Cr",
            "projectedBookings": "3,920",
            "confidence": "89.5%",
            "growthRate": "+21.4%",
            "keyDriver": "Enterprise B2B transit contracts expansion",
            "scenarios": {
                "bull": "₹1.18 Cr (+32%)",
                "base": "₹1.04 Cr (+21.4%)",
                "bear": "₹92.50L (+8.2%)",
            },
        },
        "90d": {
            "projectedRevenue": "₹1.68 Cr",
            "projectedBookings": "6,450",
            "confidence": "84.1%",
            "growthRate": "+26.0%",
            "keyDriver": "New regional industrial route launches",
            "scenarios": {
                "bull": "₹1.92 Cr (+38%)",
                "base": "₹1.68 Cr (+26.0%)",
                "bear": "₹1.44 Cr (+11.5%)",
            },
        },
    }
    return forecasts.get(horizon, forecasts["30d"])
