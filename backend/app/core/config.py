"""
Core application configuration using Pydantic Settings.
All config comes from environment variables / .env file.
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_NAME: str = "GreenTrail Intelligence"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    DEMO_MODE: bool = True
    PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://greentrail:greentrail_dev_password@localhost:5432/greentrail"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 30

    # Auth
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    # AI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_MAX_TOKENS: int = 2048
    OPENAI_TEMPERATURE: float = 0.2
    AI_ENABLED: bool = False

    # Demo
    DEMO_EVENT_RATE_PER_MINUTE: int = 120
    DEMO_COMPANIES: int = 7

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    AI_RATE_LIMIT_PER_MINUTE: int = 20

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
