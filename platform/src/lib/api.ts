/**
 * API Client — typed fetch wrapper for all GreenTrail backend endpoints
 * Handles auth headers, error handling, request IDs, and demo mode
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
};

class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function apiFetch<T>(endpoint: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-ID": crypto.randomUUID(),
    "X-Client": "greentrail-web",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    // Try to get from session storage
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("gt_token") : null;
    if (stored) headers["Authorization"] = `Bearer ${stored}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    let errorData: unknown;
    try { errorData = await res.json(); } catch { errorData = null; }
    throw new APIError(res.status, `API ${res.status}: ${endpoint}`, errorData);
  }

  return res.json();
}

// ─── API Namespaces ───────────────────────────────────────────

export const api = {
  // Health
  health: () => apiFetch<{ status: string; version: string; demo_mode: boolean }>("/api/health"),

  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ access_token: string; user: Record<string, unknown> }>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
      }),
    me: () => apiFetch<Record<string, unknown>>("/api/v1/auth/me"),
  },

  // Metrics / KPIs
  metrics: {
    snapshot: () => apiFetch<Record<string, unknown>>("/api/v1/metrics/snapshot"),
    history: (metric: string, period: string = "24h") =>
      apiFetch<unknown[]>(`/api/v1/metrics/history?metric=${metric}&period=${period}`),
    scorecard: () => apiFetch<unknown[]>("/api/v1/metrics/scorecard"),
  },

  // Events
  events: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<unknown[]>(`/api/v1/events${qs}`);
    },
    stats: () => apiFetch<Record<string, unknown>>("/api/v1/events/stats"),
  },

  // Campaigns
  campaigns: {
    list: () => apiFetch<unknown[]>("/api/v1/campaigns"),
    get: (id: string) => apiFetch<unknown>(`/api/v1/campaigns/${id}`),
    create: (data: unknown) =>
      apiFetch<unknown>("/api/v1/campaigns", { method: "POST", body: data }),
    stats: () => apiFetch<Record<string, unknown>>("/api/v1/campaigns/stats"),
  },

  // Customers
  customers: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiFetch<unknown[]>(`/api/v1/customers${qs}`);
    },
    get: (id: string) => apiFetch<unknown>(`/api/v1/customers/${id}`),
  },

  // Company
  company: {
    overview: () => apiFetch<Record<string, unknown>>("/api/v1/company/overview"),
    companies: () => apiFetch<unknown[]>("/api/v1/company/list"),
  },

  // AI
  ai: {
    ask: (question: string) =>
      apiFetch<{ answer: string; tools_used: string[]; evidence: unknown[] }>("/api/v1/ai/ask", {
        method: "POST",
        body: { question },
      }),
    insights: (limit = 20) =>
      apiFetch<unknown[]>(`/api/v1/insights?limit=${limit}`),
    generateInsight: () =>
      apiFetch<unknown>("/api/v1/insights/generate", { method: "POST" }),
  },

  // Alerts
  alerts: {
    list: (unread = false) =>
      apiFetch<unknown[]>(`/api/v1/alerts${unread ? "?unread=true" : ""}`),
    markRead: (id: string) =>
      apiFetch<void>(`/api/v1/alerts/${id}/read`, { method: "POST" }),
  },

  // Forecast
  forecast: {
    revenue: (horizon = "7d") =>
      apiFetch<unknown>(`/api/v1/forecast/revenue?horizon=${horizon}`),
    customers: (horizon = "30d") =>
      apiFetch<unknown>(`/api/v1/forecast/customers?horizon=${horizon}`),
  },

  // Integrations
  integrations: {
    list: () => apiFetch<unknown[]>("/api/v1/integrations"),
    test: (id: string) =>
      apiFetch<{ success: boolean; latency_ms: number; message: string }>(
        `/api/v1/integrations/${id}/test`,
        { method: "POST" }
      ),
    create: (data: unknown) =>
      apiFetch<unknown>("/api/v1/integrations", { method: "POST", body: data }),
  },

  // Market
  market: {
    overview: () => apiFetch<Record<string, unknown>>("/api/v1/company/market"),
  },

  // Reports
  reports: {
    generate: (type: string, params: unknown) =>
      apiFetch<unknown>("/api/v1/reports/generate", {
        method: "POST",
        body: { type, params },
      }),
    list: () => apiFetch<unknown[]>("/api/v1/reports"),
    get: (id: string) => apiFetch<unknown>(`/api/v1/reports/${id}`),
  },

  // Data Explorer
  data: {
    explore: (query: unknown) =>
      apiFetch<unknown>("/api/v1/data/explore", { method: "POST", body: query }),
    datasets: () => apiFetch<unknown[]>("/api/v1/data/datasets"),
  },

  // System
  system: {
    health: () => apiFetch<Record<string, unknown>>("/api/v1/system/health"),
    connectors: () => apiFetch<unknown[]>("/api/v1/system/connectors"),
  },

  // Resources
  resources: {
    list: () => apiFetch<unknown[]>("/api/v1/resources"),
  },
};

export { APIError };
