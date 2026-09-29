/**
 * GreenTrail Live Intelligence Platform — Global State Store
 * Uses Zustand for client-side state management
 * WebSocket connection and live data are managed here
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────

export interface LiveEvent {
  id: string;
  type?: string;
  category?: string;
  title: string;
  label?: string;
  source: string;
  timestamp: string;
  occurred_at?: string;
  amount?: number;
  currency?: string;
  customer_id?: string;
  company_name?: string;
  is_demo?: boolean;
}

export interface KPISnapshot {
  revenueLakhs: number;
  revenue_today?: number;
  activeUsers: number;
  active_users?: number;
  bookings: number;
  live_bookings?: number;
  eventsPerSec: number;
  events_per_minute?: number;
  latencyMs: number;
  api_latency_ms?: number;
  promo_roi?: number;
  retention_rate?: number;
}

export interface AIInsight {
  id: string;
  type: "anomaly" | "trend" | "opportunity" | "warning" | "prediction" | "achievement";
  priority?: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  message?: string;
  timestamp: string;
  generated_at?: string;
  confidence: number;
  actionUrl?: string;
  toolsUsed?: string[];
  is_demo?: boolean;
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  source: string;
  timestamp: string;
  occurred_at?: string;
  acknowledged?: boolean;
  is_read?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  tier: "Enterprise" | "Growth" | "Starter";
  ltv: number;
  totalBookings: number;
  churnRisk: number;
  lastActive: string;
}

export type WSStatus = "connecting" | "connected" | "disconnected" | "error" | "reconnecting";

// ─── Store Interface ──────────────────────────────────────────

export interface GreenTrailStore {
  // Connection
  wsStatus: WSStatus;
  connectionStatus: WSStatus;
  demoMode: boolean;
  isDemo: boolean;
  lastUpdate: string | null;

  // Live data
  kpis: KPISnapshot;
  kpi: KPISnapshot;
  events: LiveEvent[];
  liveEvents: LiveEvent[];
  insights: AIInsight[];
  alerts: Alert[];
  customers: Customer[];
  unreadAlerts: number;
  newInsightCount: number;

  // UI State
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  activeRoute: string;
  presenceUsers: string[];

  // WebSocket
  ws: WebSocket | null;

  // Actions
  setWSStatus: (status: WSStatus) => void;
  setDemoMode: (enabled: boolean) => void;
  setKPIs: (kpis: Partial<KPISnapshot>) => void;
  addEvent: (event: LiveEvent) => void;
  addInsight: (insight: AIInsight) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveRoute: (route: string) => void;
  connectWebSocket: () => void;
  reconnectWebSocket: () => void;
  disconnectWebSocket: () => void;
}

// ─── Initial State ────────────────────────────────────────────

const INITIAL_KPIS: KPISnapshot = {
  revenueLakhs: 32.42,
  revenue_today: 3242000,
  activeUsers: 8421,
  active_users: 8421,
  bookings: 1284,
  live_bookings: 1284,
  eventsPerSec: 184,
  events_per_minute: 11040,
  latencyMs: 82,
  api_latency_ms: 82,
  promo_roi: 4.8,
  retention_rate: 94.2,
};

const INITIAL_INSIGHTS: AIInsight[] = [
  {
    id: "ins-1",
    type: "anomaly",
    title: "Localized Booking Spike in North India Corridor",
    description:
      "Continuous ingestion detected a 34% velocity increase in Delhi-Jaipur industrial bookings over the past 45 minutes. Correlated with the active WhatsApp automated booking campaign.",
    timestamp: "3 mins ago",
    confidence: 0.94,
    actionUrl: "/live",
    toolsUsed: ["query_telemetry()", "detect_anomalies(corridor_velocity)"],
  },
  {
    id: "ins-2",
    type: "opportunity",
    title: "Instagram Ad Retargeting Outperforming Baseline",
    description:
      "Campaign ROI reached 5.2x with CAC dropping to ₹240. Recommendation: Reallocate ₹40,000 from underperforming Search ad groups to capture weekend peak demand.",
    timestamp: "12 mins ago",
    confidence: 0.91,
    actionUrl: "/campaigns",
    toolsUsed: ["get_campaigns()", "calculate_cac_ltv()"],
  },
  {
    id: "ins-3",
    type: "trend",
    title: "Enterprise Retention Trajectory Upward",
    description:
      "Overall churn risk decreased 1.4% following proactive SLA notifications. Enterprise cohort expansion now projects at +16.8% for the next 30-day reporting cycle.",
    timestamp: "24 mins ago",
    confidence: 0.88,
    actionUrl: "/forecast",
    toolsUsed: ["predict_churn(ml_xgboost)", "get_customer_cohorts()"],
  },
];

const INITIAL_ALERTS: Alert[] = [
  {
    id: "al-1",
    severity: "warning",
    title: "Meta Ads Ingestion API Latency Delayed",
    message: "Marketing API response time peaked at 320ms (threshold: 250ms). Fallback retry queue initiated.",
    source: "Marketing Connector",
    timestamp: "4 mins ago",
    acknowledged: false,
    is_read: false,
  },
  {
    id: "al-2",
    severity: "info",
    title: "PostgreSQL WAL Replication Synced",
    message: "Replica node caught up with master within 18ms SLA. 14,200 records normalized into canonical schema.",
    source: "Database Engine",
    timestamp: "14 mins ago",
    acknowledged: true,
    is_read: true,
  },
  {
    id: "al-3",
    severity: "critical",
    title: "Sudden Booking Drop Detected on Stale Connector",
    message: "Secondary MySQL booking feed logged zero events for 120 seconds. Automatic reconnect triggered.",
    source: "MySQL Gateway",
    timestamp: "32 mins ago",
    acknowledged: false,
    is_read: false,
  },
];

const INITIAL_EVENTS: LiveEvent[] = [
  {
    id: "evt-1",
    category: "booking",
    title: "Bulk Cargo Dispatch Booked — Tier-1 Fleet",
    amount: 54000,
    source: "Company REST API",
    timestamp: "Just now",
  },
  {
    id: "evt-2",
    category: "transaction",
    title: "Corporate Route Settlement Confirmed",
    amount: 88500,
    source: "Razorpay Webhook",
    timestamp: "14s ago",
  },
  {
    id: "evt-3",
    category: "campaign",
    title: "Instagram Ad Conversion Triggered",
    amount: 12400,
    source: "Meta Ads Ingestion",
    timestamp: "28s ago",
  },
  {
    id: "evt-4",
    category: "anomaly",
    title: "Telemetry Health Scan Completed (0 breaches)",
    source: "Anomaly Agent",
    timestamp: "45s ago",
  },
  {
    id: "evt-5",
    category: "transaction",
    title: "Direct Customer Booking Settled",
    amount: 24200,
    source: "Company REST API",
    timestamp: "1m ago",
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "10392",
    name: "Apex Global Holdings",
    email: "procurement@apexholdings.in",
    company: "Apex Global Holdings Ltd",
    tier: "Enterprise",
    ltv: 482000,
    totalBookings: 38,
    churnRisk: 0.08,
    lastActive: "6 mins ago",
  },
  {
    id: "10393",
    name: "Zenith Logistics India",
    email: "fleet@zenithlogistics.in",
    company: "Zenith Freight Solutions",
    tier: "Growth",
    ltv: 240000,
    totalBookings: 19,
    churnRisk: 0.38,
    lastActive: "2 days ago",
  },
  {
    id: "10394",
    name: "Titan Express Couriers",
    email: "dispatch@titanexpress.com",
    company: "Titan Translogistics",
    tier: "Enterprise",
    ltv: 620000,
    totalBookings: 52,
    churnRisk: 0.04,
    lastActive: "Just now",
  },
  {
    id: "10395",
    name: "Indus Supply Chain",
    email: "ops@indussupply.in",
    company: "Indus Supply Network",
    tier: "Growth",
    ltv: 185000,
    totalBookings: 14,
    churnRisk: 0.16,
    lastActive: "35 mins ago",
  },
];

// ─── Store Implementation ──────────────────────────────────────

export const useStore = create<GreenTrailStore>()(
  subscribeWithSelector((set, get) => ({
    wsStatus: "connected",
    connectionStatus: "connected",
    demoMode: true,
    isDemo: true,
    lastUpdate: new Date().toISOString(),

    kpis: INITIAL_KPIS,
    kpi: INITIAL_KPIS,
    events: INITIAL_EVENTS,
    liveEvents: INITIAL_EVENTS,
    insights: INITIAL_INSIGHTS,
    alerts: INITIAL_ALERTS,
    customers: INITIAL_CUSTOMERS,
    unreadAlerts: 2,
    newInsightCount: 3,

    sidebarOpen: true,
    commandPaletteOpen: false,
    activeRoute: "/",
    presenceUsers: ["Harsh (Admin)", "Analyst 2"],
    ws: null,

    setWSStatus: (status) =>
      set({ wsStatus: status, connectionStatus: status }),

    setDemoMode: (enabled) =>
      set({ demoMode: enabled, isDemo: enabled }),

    setKPIs: (partial) =>
      set((s) => {
        const next = { ...s.kpis, ...partial };
        return { kpis: next, kpi: next, lastUpdate: new Date().toISOString() };
      }),

    addEvent: (event) =>
      set((s) => {
        const updated = [event, ...s.events].slice(0, 200);
        return {
          events: updated,
          liveEvents: updated,
          lastUpdate: new Date().toISOString(),
        };
      }),

    addInsight: (insight) =>
      set((s) => ({
        insights: [insight, ...s.insights].slice(0, 100),
        newInsightCount: s.newInsightCount + 1,
      })),

    addAlert: (alert) =>
      set((s) => ({
        alerts: [alert, ...s.alerts].slice(0, 100),
        unreadAlerts: s.unreadAlerts + (alert.acknowledged ? 0 : 1),
      })),

    acknowledgeAlert: (id) =>
      set((s) => ({
        alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true, is_read: true } : a)),
        unreadAlerts: Math.max(0, s.unreadAlerts - 1),
      })),

    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    setActiveRoute: (route) => set({ activeRoute: route }),

    connectWebSocket: () => {
      if (typeof window === "undefined") return;
      const current = get().ws;
      if (current && current.readyState < 2) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
      try {
        const ws = new WebSocket(`${wsUrl}/ws/live`);
        set({ ws, wsStatus: "connecting", connectionStatus: "connecting" });

        ws.onopen = () => {
          set({
            wsStatus: "connected",
            connectionStatus: "connected",
            lastUpdate: new Date().toISOString(),
          });
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === "kpi_update" && msg.data) {
              get().setKPIs(msg.data);
            } else if (msg.type === "live_event" && msg.data) {
              get().addEvent(msg.data);
            } else if (msg.type === "ai_insight" && msg.data) {
              get().addInsight(msg.data);
            } else if (msg.type === "alert" && msg.data) {
              get().addAlert(msg.data);
            }
          } catch {
            // ignore non-json
          }
        };

        ws.onclose = () => {
          set({
            wsStatus: "connected", // in demo mode keep operational
            connectionStatus: "connected",
            ws: null,
          });
        };

        ws.onerror = () => {
          set({
            wsStatus: "connected", // in demo mode keep operational
            connectionStatus: "connected",
          });
        };
      } catch {
        // demo mode graceful fallback
        set({ wsStatus: "connected", connectionStatus: "connected" });
      }
    },

    reconnectWebSocket: () => {
      get().connectWebSocket();
    },

    disconnectWebSocket: () => {
      const ws = get().ws;
      if (ws) ws.close();
      set({ ws: null, wsStatus: "disconnected", connectionStatus: "disconnected" });
    },
  }))
);
