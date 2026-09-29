"""
Authentication & RBAC Router
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    permissions: List[str]


@router.post("/login")
async def login(req: LoginRequest):
    # Enterprise mock authentication
    return {
        "access_token": "gt_jwt_token_sample_harsh_superadmin",
        "token_type": "bearer",
        "user": {
            "id": "usr_harsh_01",
            "name": "Harsh",
            "email": "harsh@greentrail.internal",
            "role": "Superadmin",
            "permissions": ["all"],
        },
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user():
    return UserResponse(
        id="usr_harsh_01",
        name="Harsh",
        email="harsh@greentrail.internal",
        role="Superadmin",
        permissions=["read", "write", "admin", "connectors", "ai"],
    )
