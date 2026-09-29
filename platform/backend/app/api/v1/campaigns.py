"""
Campaigns & Marketing Attribution Router
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_campaigns():
    return [
        {
            "name": "Instagram Corporate Retargeting",
            "channel": "Instagram Ads",
            "spend": 85000,
            "revenue": 442000,
            "roi": 5.2,
            "cvr": 4.8,
            "cac": 240,
            "status": "Active",
        },
        {
            "name": "Google Search Ads — Corporate Transit",
            "channel": "Google Ads",
            "spend": 140000,
            "revenue": 518000,
            "roi": 3.7,
            "cvr": 3.2,
            "cac": 490,
            "status": "Active",
        },
        {
            "name": "LinkedIn B2B Freight Logistics",
            "channel": "LinkedIn Ads",
            "spend": 95000,
            "revenue": 420000,
            "roi": 4.4,
            "cvr": 2.9,
            "cac": 620,
            "status": "Active",
        },
        {
            "name": "WhatsApp Automated Booking Pilot",
            "channel": "Direct Messaging",
            "spend": 22000,
            "revenue": 165000,
            "roi": 7.5,
            "cvr": 14.2,
            "cac": 110,
            "status": "Scaling",
        },
    ]
