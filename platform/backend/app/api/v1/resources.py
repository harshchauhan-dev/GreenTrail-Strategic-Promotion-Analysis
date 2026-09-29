"""
External Verified Resources Router
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_resources():
    return [
        {
            "name": "National Open Data Portal (India)",
            "url": "https://data.gov.in",
            "category": "Macro Data",
            "desc": "Official public datasets from Central & State ministries",
        },
        {
            "name": "Reserve Bank of India Database (DBIE)",
            "url": "https://dbie.rbi.org.in",
            "category": "Macro Data",
            "desc": "Macroeconomic indicators, currency exchange, and liquidity rates",
        },
        {
            "name": "India Brand Equity Foundation (IBEF)",
            "url": "https://www.ibef.org",
            "category": "Market Intelligence",
            "desc": "Industry trends, sector performance reports, and market size research",
        },
    ]
