"""
Database Engine & Persistence Layer
Production-ready relational schema with SQLite / PostgreSQL support.
Uses native SQLite connection with rich automated seed data for real AI grounding.
"""

import sqlite3
import os
import structlog

logger = structlog.get_logger()
DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "greentrail.db")


def get_db_connection():
    """Returns a connection to the SQLite database with Row factory"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def seed_initial_data(conn: sqlite3.Connection):
    """Populates realistic enterprise operational data if tables are empty"""
    cursor = conn.cursor()

    # 1. Customers
    cursor.execute("SELECT COUNT(*) FROM customers")
    if cursor.fetchone()[0] == 0:
        customers_data = [
            ("10392", "Apex Global Holdings", "procurement@apexholdings.in", "Apex Global Holdings Ltd", "Enterprise", 482000.0, 38, 0.08, "2026-09-29 14:15:00"),
            ("10393", "Zenith Logistics India", "fleet@zenithlogistics.in", "Zenith Freight Solutions", "Growth", 240000.0, 19, 0.38, "2026-09-27 11:30:00"),
            ("10394", "Titan Express Couriers", "dispatch@titanexpress.com", "Titan Translogistics", "Enterprise", 620000.0, 52, 0.04, "2026-09-29 16:45:00"),
            ("10395", "Indus Supply Chain", "ops@indussupply.in", "Indus Supply Network", "Growth", 185000.0, 14, 0.16, "2026-09-29 09:20:00"),
            ("10396", "Bharat Logistics Cargo", "admin@bharatcargo.in", "Bharat Cargo Express", "Enterprise", 540000.0, 44, 0.09, "2026-09-29 15:10:00"),
            ("10397", "Vanguard Transit Solutions", "transit@vanguard.co.in", "Vanguard Transit Ltd", "Growth", 210000.0, 16, 0.22, "2026-09-28 17:05:00"),
        ]
        cursor.executemany(
            "INSERT INTO customers (id, name, email, company, tier, ltv, total_bookings, churn_risk, last_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            customers_data
        )

    # 2. Campaigns
    cursor.execute("SELECT COUNT(*) FROM campaigns")
    if cursor.fetchone()[0] == 0:
        campaigns_data = [
            ("camp-1", "Instagram Corporate Retargeting", "Instagram Ads", 85000.0, 442000.0, 5.2, "Active"),
            ("camp-2", "Google Search Ads — Corporate Transit", "Google Ads", 140000.0, 518000.0, 3.7, "Active"),
            ("camp-3", "LinkedIn B2B Freight Logistics", "LinkedIn Ads", 95000.0, 420000.0, 4.4, "Active"),
            ("camp-4", "WhatsApp Automated Booking Pilot", "Direct Messaging", 22000.0, 165000.0, 7.5, "Scaling"),
            ("camp-5", "YouTube Regional Brand Awareness", "YouTube Video", 45000.0, 126000.0, 2.8, "Paused"),
        ]
        cursor.executemany(
            "INSERT INTO campaigns (id, name, channel, spend, revenue, roi, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            campaigns_data
        )

    # 3. Transactions
    cursor.execute("SELECT COUNT(*) FROM transactions")
    if cursor.fetchone()[0] == 0:
        transactions_data = [
            ("TX-9901", "10392", 42500.0, "INR", "Settled", "Razorpay Webhook", "2026-09-29 14:20:00"),
            ("TX-9902", "10394", 88000.0, "INR", "Settled", "Company REST API", "2026-09-29 13:45:00"),
            ("TX-9903", "10395", 34200.0, "INR", "Settled", "Razorpay Webhook", "2026-09-29 12:10:00"),
            ("TX-9904", "10396", 62000.0, "INR", "Settled", "Bank Wire Gateway", "2026-09-29 11:30:00"),
            ("TX-9905", "10393", 18500.0, "INR", "Settled", "UPI Webhook", "2026-09-27 10:15:00"),
            ("TX-9906", "10394", 125000.0, "INR", "Settled", "Enterprise PO Sync", "2026-09-28 16:00:00"),
            ("TX-9907", "10392", 54000.0, "INR", "Settled", "Razorpay Webhook", "2026-09-28 14:30:00"),
            ("TX-9908", "10397", 29000.0, "INR", "Settled", "Company REST API", "2026-09-28 09:40:00"),
            ("TX-9909", "10396", 74500.0, "INR", "Settled", "Razorpay Webhook", "2026-09-29 08:20:00"),
        ]
        cursor.executemany(
            "INSERT INTO transactions (id, customer_id, amount, currency, status, source, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            transactions_data
        )

    # 4. Bookings
    cursor.execute("SELECT COUNT(*) FROM bookings")
    if cursor.fetchone()[0] == 0:
        bookings_data = [
            ("BK-8801", "10392", "Western Ghats Corridor", "Mumbai - Pune Industrial Corridor", 42500.0, "Completed", "2026-09-29 14:20:00"),
            ("BK-8802", "10394", "North Freight Expressway", "Delhi NCR - Jaipur Transit", 88000.0, "Completed", "2026-09-29 13:45:00"),
            ("BK-8803", "10395", "Deccan Commercial Belt", "Bengaluru - Hyderabad Corridor", 34200.0, "In-Transit", "2026-09-29 12:10:00"),
            ("BK-8804", "10396", "Gujarat Industrial Way", "Ahmedabad - Surat Corridor", 62000.0, "Completed", "2026-09-29 11:30:00"),
            ("BK-8805", "10393", "Central India Route", "Nagpur - Bhopal Transit", 18500.0, "Completed", "2026-09-27 10:15:00"),
        ]
        cursor.executemany(
            "INSERT INTO bookings (id, customer_id, trail, route, amount, status, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            bookings_data
        )

    # 5. Integrations
    cursor.execute("SELECT COUNT(*) FROM integrations")
    if cursor.fetchone()[0] == 0:
        integrations_data = [
            ("conn-1", "Corporate REST API Feed", "REST API", "https://api.company.internal/v1/telemetry", "Bearer Token", "connected", "2026-09-29 16:50:00", 1),
            ("conn-2", "Primary PostgreSQL Warehouse", "Database", "postgres://prod-read-replica:5432/greentrail", "Encrypted Vault", "connected", "2026-09-29 16:51:00", 1),
            ("conn-3", "Payment Gateway Webhook", "Webhook", "/api/v1/integrations/webhook/razorpay", "HMAC-SHA256", "connected", "2026-09-29 16:51:30", 1),
            ("conn-4", "Salesforce CRM Gateway", "CRM Feed", "https://api.salesforce.com/services/data/v58.0", "OAuth 2.0", "connected", "2026-09-29 16:48:00", 1),
            ("conn-5", "Meta & Google Ads Sync", "Marketing API", "https://graph.facebook.com/v19.0/act_ads", "OAuth 2.0", "delayed", "2026-09-29 16:40:00", 1),
            ("conn-6", "Live IoT Fleet Sensor WebSocket", "WebSocket", "wss://telemetry.internal/fleet/live", "mTLS", "connected", "2026-09-29 16:52:00", 1),
        ]
        cursor.executemany(
            "INSERT INTO integrations (id, name, type, endpoint, auth_type, status, last_sync, is_demo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            integrations_data
        )

    # 6. Alerts
    cursor.execute("SELECT COUNT(*) FROM alerts")
    if cursor.fetchone()[0] == 0:
        alerts_data = [
            ("al-1", "warning", "Meta Ads Ingestion API Latency Delayed", "Marketing API response time peaked at 320ms (threshold: 250ms). Fallback retry queue initiated.", "Marketing Connector", 0, "2026-09-29 16:45:00"),
            ("al-2", "info", "PostgreSQL WAL Replication Synced", "Replica node caught up with master within 18ms SLA. 14,200 records normalized into canonical schema.", "Database Engine", 1, "2026-09-29 16:30:00"),
            ("al-3", "critical", "Sudden Booking Drop Detected on Stale Connector", "Secondary MySQL booking feed logged zero events for 120 seconds. Automatic reconnect triggered.", "MySQL Gateway", 0, "2026-09-29 16:15:00"),
        ]
        cursor.executemany(
            "INSERT INTO alerts (id, severity, title, message, source, acknowledged, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            alerts_data
        )

    conn.commit()


async def create_db_tables():
    """Initializes all canonical tables and seeds records in the SQLite database"""
    conn = get_db_connection()
    cursor = conn.cursor()

    schema_sql = """
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        auth_type TEXT NOT NULL,
        status TEXT NOT NULL,
        last_sync TIMESTAMP,
        is_demo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        company TEXT,
        tier TEXT,
        ltv REAL,
        total_bookings INTEGER,
        churn_risk REAL,
        last_active TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'INR',
        status TEXT NOT NULL,
        source TEXT,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        customer_id TEXT,
        trail TEXT,
        route TEXT,
        amount REAL,
        status TEXT,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        channel TEXT NOT NULL,
        spend REAL,
        revenue REAL,
        roi REAL,
        status TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        source TEXT NOT NULL,
        amount REAL,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT,
        acknowledged INTEGER DEFAULT 0,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        confidence REAL,
        action_url TEXT,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    cursor.executescript(schema_sql)
    conn.commit()

    # Seed initial data
    seed_initial_data(conn)
    conn.close()
    logger.info("database.tables_initialized_and_seeded", db_file=DB_FILE)


async def get_db():
    """Async generator yielding database connection"""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()
