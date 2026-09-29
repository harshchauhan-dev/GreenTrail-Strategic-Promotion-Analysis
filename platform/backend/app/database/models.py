"""
SQLAlchemy async database models — full production schema
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Enum, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func
import uuid
import enum


class Base(DeclarativeBase):
    pass


def gen_uuid():
    return str(uuid.uuid4())


# ─── Enums ───────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"

class AlertSeverity(str, enum.Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"
    SUCCESS = "success"

class IntegrationStatus(str, enum.Enum):
    CONNECTED = "connected"
    DEGRADED = "degraded"
    FAILED = "failed"
    PENDING = "pending"
    DISABLED = "disabled"

class IntegrationType(str, enum.Enum):
    REST_API = "rest_api"
    GRAPHQL = "graphql"
    WEBSOCKET = "websocket"
    WEBHOOK = "webhook"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    CSV = "csv"
    CRM = "crm"
    DEMO = "demo"

class CampaignStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"
    SCHEDULED = "scheduled"

class InsightType(str, enum.Enum):
    ANOMALY = "anomaly"
    TREND = "trend"
    OPPORTUNITY = "opportunity"
    WARNING = "warning"
    PREDICTION = "prediction"
    ACHIEVEMENT = "achievement"


# ─── Users & Auth ────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.ANALYST, nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(512), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # soft delete

    audit_logs = relationship("AuditLog", back_populates="user")
    ai_queries = relationship("AIQuery", back_populates="user")
    comments = relationship("InsightComment", back_populates="user")


# ─── Company & Integrations ──────────────────────────────────

class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    icon = Column(String(10), default="🏢")
    color = Column(String(20), default="#4ade80")
    category = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    website = Column(String(512), nullable=True)
    contact_email = Column(String(255), nullable=True)
    status = Column(String(50), default="active")
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    integrations = relationship("Integration", back_populates="company")
    customers = relationship("Customer", back_populates="company")


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(Enum(IntegrationType), nullable=False)
    status = Column(Enum(IntegrationStatus), default=IntegrationStatus.PENDING)
    config = Column(JSON, default=dict)          # non-sensitive config (URL, polling interval, etc.)
    # credentials stored encrypted server-side, never returned to frontend
    credentials_encrypted = Column(Text, nullable=True)
    field_mappings = Column(JSON, default=dict)  # GreenTrail field → company field
    polling_interval_seconds = Column(Integer, default=30)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    records_processed = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    latency_ms = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="integrations")


# ─── Canonical Data Models ───────────────────────────────────

class Customer(Base):
    """Canonical Customer — normalized from any CRM/API"""
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    external_id = Column(String(255), nullable=True)   # original ID from source system
    source = Column(String(100), nullable=True)         # connector that created this
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    segment = Column(String(100), nullable=True)
    tier = Column(String(50), nullable=True)
    lifetime_value = Column(Float, default=0)
    churn_probability = Column(Float, nullable=True)
    last_activity_at = Column(DateTime(timezone=True), nullable=True)
    tags = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    company = relationship("Company", back_populates="customers")
    transactions = relationship("Transaction", back_populates="customer")

    __table_args__ = (
        Index("ix_customers_company_segment", "company_id", "segment"),
        UniqueConstraint("company_id", "external_id", name="uq_customer_external"),
    )


class Transaction(Base):
    """Canonical Transaction — booking, purchase, order, etc."""
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    external_id = Column(String(255), nullable=True)
    source = Column(String(100), nullable=True)
    type = Column(String(50), nullable=False)            # booking | purchase | refund | etc.
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="completed")
    trail = Column(String(255), nullable=True)           # GreenTrail-specific
    location = Column(String(255), nullable=True)
    channel = Column(String(100), nullable=True)
    metadata = Column(JSON, default=dict)
    occurred_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="transactions")
    __table_args__ = (
        Index("ix_transactions_company_occurred", "company_id", "occurred_at"),
    )


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    external_id = Column(String(255), nullable=True)
    name = Column(String(512), nullable=False)
    channel = Column(String(100), nullable=True)
    status = Column(Enum(CampaignStatus), default=CampaignStatus.ACTIVE)
    reach = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    spend = Column(Float, default=0)
    revenue = Column(Float, default=0)
    budget = Column(Float, default=0)
    cpa = Column(Float, nullable=True)
    roi = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    metadata = Column(JSON, default=dict)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Event(Base):
    """Canonical live event — booking, signup, review, etc."""
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=True)
    integration_id = Column(String, ForeignKey("integrations.id"), nullable=True)
    type = Column(String(100), nullable=False, index=True)
    label = Column(String(255), nullable=False)
    icon = Column(String(10), nullable=True)
    location = Column(String(255), nullable=True)
    trail = Column(String(255), nullable=True)
    amount = Column(Float, nullable=True)
    source = Column(String(100), nullable=True)
    payload = Column(JSON, default=dict)
    occurred_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_events_company_type_time", "company_id", "type", "occurred_at"),
    )


class MetricSnapshot(Base):
    """Time-series KPI snapshots — written by data engine every N seconds"""
    __tablename__ = "metric_snapshots"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    source = Column(String(100), nullable=True)
    name = Column(String(100), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    metadata = Column(JSON, default=dict)
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)

    __table_args__ = (
        Index("ix_metrics_company_name_time", "company_id", "name", "recorded_at"),
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    severity = Column(Enum(AlertSeverity), nullable=False)
    title = Column(String(512), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    source = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String, ForeignKey("users.id"), nullable=True)
    metadata = Column(JSON, default=dict)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(String, primary_key=True, default=gen_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    type = Column(Enum(InsightType), nullable=False)
    priority = Column(String(20), default="medium")
    title = Column(String(512), nullable=False)
    message = Column(Text, nullable=False)
    metric = Column(String(100), nullable=True)
    change_value = Column(Float, nullable=True)
    evidence = Column(JSON, default=dict)
    agent = Column(String(100), nullable=True)       # which agent generated this
    is_dismissed = Column(Boolean, default=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    comments = relationship("InsightComment", back_populates="insight")


class InsightComment(Base):
    __tablename__ = "insight_comments"

    id = Column(String, primary_key=True, default=gen_uuid)
    insight_id = Column(String, ForeignKey("ai_insights.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    insight = relationship("AIInsight", back_populates="comments")
    user = relationship("User", back_populates="comments")


class AIQuery(Base):
    """Audit log for all AI queries — token tracking, traceability"""
    __tablename__ = "ai_queries"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    tools_used = Column(JSON, default=list)
    tokens_prompt = Column(Integer, nullable=True)
    tokens_completion = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    model = Column(String(100), nullable=True)
    success = Column(Boolean, default=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="ai_queries")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String(512), nullable=False)
    type = Column(String(100), nullable=True)        # executive | campaign | customer | custom
    content = Column(JSON, default=dict)             # structured report data
    summary = Column(Text, nullable=True)
    status = Column(String(50), default="generating")
    is_shared = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Resource(Base):
    """External resource links — configured by admin, shown in Resource Center"""
    __tablename__ = "resources"

    id = Column(String, primary_key=True, default=gen_uuid)
    category = Column(String(100), nullable=False)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(2048), nullable=False)
    icon = Column(String(10), nullable=True)
    is_verified = Column(Boolean, default=False)     # admin-verified URLs only
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    """Immutable audit trail — never deleted"""
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False, index=True)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(512), nullable=True)
    request_id = Column(String(255), nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="audit_logs")
