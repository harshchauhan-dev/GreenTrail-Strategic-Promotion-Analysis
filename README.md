# GreenTrail — Live Intelligence Platform

**GreenTrail** is a production-grade **Live Web Intelligence Platform** engineered for continuous, real-time telemetry ingestion and automated decision intelligence across authorized enterprise data sources.

Designed with a single-page application (SPA) terminal feel inspired by Palantir and Bloomberg enterprise platforms, GreenTrail delivers sub-second operational awareness while internally orchestrating a modular, multi-source ingestion pipeline.

---

## ⚡ Key Highlights

- **Single-Page Application Shell**: Persistent global top bar, real-time status banner, unified navigation, micro-interactions, and instant route transitions across deep links (`/live`, `/company`, `/market`, `/customers`, `/campaigns`, `/insights`, `/forecast`, `/alerts`, `/data`, `/ai`, `/reports`, `/integrations`, `/resources`, `/settings`, `/system`).
- **Live Ingestion Engine**: Normalized multi-connector layer supporting REST APIs, Webhooks, WebSockets, PostgreSQL/MySQL CDC WAL streams, CSV feeds, and CRM platforms.
- **Autonomous Green AI**: Controlled internal agent modules (Analyst, Anomaly, Forecast, Report, Research, Alert) executing governed backend tools with traceable evidence citations and zero direct production database write privileges.
- **Real-Time Telemetry & Alert Center**: Event-driven notification dispatch via WebSockets, with direct integration to Slack, Microsoft Teams, PagerDuty, and email webhooks.
- **Predictive ML Demand & Churn Modeling**: Multi-horizon revenue forecasts (30/60/90 days), Monte Carlo probabilistic envelopes (P10/P50/P90), and XGBoost customer churn risk assessment.
- **Company Connector Hub**: Ingestion configuration wizard with zero-secret exposure (all credentials encrypted server-side).
- **Strict Demo Mode Isolation**: Clearly labeled `DEMO DATA` mode using synthetic streaming feeds that match canonical internal schemas, seamlessly replaceable by setting real company credentials in `.env`.

---

## 🏗️ Platform Architecture

```
                    External Enterprise Sources
   [REST APIs] [Webhooks] [WebSockets] [PostgreSQL/MySQL] [CRM/ERP]
                                ↓
                 Connector & Ingestion Gateway
                   (HMAC / OAuth2 / Bearer)
                                ↓
                 Validation & Normalization Layer
             (Canonical GreenTrail Unified Schema)
                                ↓
                    Event Bus / Redis Queue
                                ↓
                  PostgreSQL Data Warehouse
                                ↓
                       Redis Cache / PubSub
                                ↓
                   FastAPI Realtime Broker
                        (/ws/live)
                                ↓
               Next.js 16 + TypeScript Frontend
     (Zustand Store • Responsive Terminal UI • Sonner Toaster)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+ (tested on Node v24)
- **Python**: 3.11+ (tested on Python 3.12)
- **Database**: PostgreSQL (or SQLite/aiosqlite for zero-setup local dev)
- **Cache (Optional)**: Redis

### 2. Frontend Setup
```bash
npm install
npm run build
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows (or source venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
Backend API docs available at: **`http://localhost:8000/docs`**

---

## 🧭 Routes & Deep Links

| Route | View | Description |
|---|---|---|
| `/` | **Command Overview** | Real-time system status, live KPIs, autonomous AI insights, live activity stream, and alerts |
| `/live` | **Live Operations** | Real-time telemetry feed, category filters, latency metrics, and event tracing |
| `/company` | **Company 360°** | Unified executive dashboard: financials, customer base, marketing ROI, and SLA |
| `/market` | **Market Intelligence** | Macroeconomic indicators, freight indices, competitor trends, and verified external portals |
| `/customers` | **Customer Intelligence** | Account directory, LTV scoring, predictive churn risk, and tier segmentation |
| `/customers/:id` | **Customer 360°** | Individual account dossier, transaction log, marketing touchpoints, and ML churn profile |
| `/campaigns` | **Campaign Attribution** | Ad spend tracking, channel ROI multipliers, CAC/LTV ratios, and spend optimization |
| `/optimizer` | **AI Budget Optimizer** | Markowitz Modern Portfolio Theory capital allocation across marketing channels with interactive risk sliders |
| `/insights` | **Autonomous AI Insights** | Continuous drift detection, statistical anomaly flags, and one-click AI investigations |
| `/forecast` | **Predictive Forecasting** | Probabilistic demand curves (30/60/90d), Monte Carlo bands (P10/P50/P90), and stress tests |
| `/alerts` | **Alert Center** | Triggered threshold conditions, severity filters, and dispatch channel status (Slack/Teams) |
| `/data` | **Data Explorer** | Safe query builder, dimension groupings, aggregations, and CSV/JSON exports |
| `/ai` | **Green AI Studio** | Specialized agent workshop (Analyst, Anomaly, Forecast, Report, Research, Alert) |
| `/reports` | **Executive Dossier** | Automated board briefing synthesis with verified metrics, anomalies, and PDF/Print |
| `/integrations`| **Connector Hub** | Ingestion pipeline health, connector configuration wizard, and data health center |
| `/resources` | **External Resources** | Verified official portals (data.gov.in, RBI, MoRTH, IBEF, NITI Aayog) |
| `/settings` | **Platform Governance**| RBAC policies, API rate limiting, audit logging, and Demo Mode toggling |
| `/system` | **Observability** | Infrastructure health, WebSocket broadcast latency, database pools, and query times |

---

## ⌨️ Global Shortcuts

- **`Ctrl + K`** (or **`Cmd + K`**): Open the **Command Palette** to search customers, execute investigations, jump across routes, or toggle settings.
- **Escape**: Close modals, drawers, or command palette.

---

## 🔒 Security & RBAC Standards

- **Server-Side Secret Isolation**: No API keys, database credentials, or webhook secrets are ever exposed to the client application.
- **Controlled Tool Calling**: Green AI uses strict function calling with input sanitization; LLMs are never permitted to execute arbitrary SQL or raw database commands.
- **Role-Based Access Control**: Granular permissions across `Superadmin`, `Analyst`, and `Viewer` roles.
- **Audit Logging**: Immutable logging for data queries, report exports, connector modifications, and administrative logins.

---

## 📄 License
Enterprise Proprietary — GreenTrail Technologies Pvt. Ltd.
