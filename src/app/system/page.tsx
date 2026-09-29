"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Server,
  Activity,
  Cpu,
  Database,
  Radio,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
} from "lucide-react";

export default function SystemHealthPage() {
  const { kpis, connectionStatus, demoMode } = useStore();
  const { triggerAiPrompt } = useApp();

  const services = [
    {
      name: "FastAPI REST Gateway (v1)",
      status: "operational",
      uptime: "99.98%",
      latency: `${kpis.latencyMs}ms`,
      p99: "112ms",
      load: "14%",
      notes: "Handling 18 versioned endpoints with GZip compression and request ID tagging",
    },
    {
      name: "WebSocket & SSE Realtime Gateway",
      status: connectionStatus === "connected" ? "operational" : "degraded",
      uptime: "99.95%",
      latency: "12ms",
      p99: "28ms",
      load: "8%",
      notes: "/ws/live, /ws/alerts, /ws/presence broadcast loops active",
    },
    {
      name: "PostgreSQL Database Engine",
      status: "operational",
      uptime: "100.0%",
      latency: "8ms",
      p99: "22ms",
      load: "22%",
      notes: "Connection pool active (20 max connections, 0 waiting)",
    },
    {
      name: "Redis Cache & Pub/Sub Queue",
      status: "operational",
      uptime: "100.0%",
      latency: "1.4ms",
      p99: "3.2ms",
      load: "11%",
      notes: "In-memory event buffer & session cache",
    },
    {
      name: "Green AI Tool Orchestrator",
      status: "operational",
      uptime: "99.92%",
      latency: "840ms",
      p99: "1,200ms",
      load: "5%",
      notes: "Controlled function calling layer with prompt injection filters",
    },
    {
      name: "Ingestion Normalizer & Schema Engine",
      status: "operational",
      uptime: "100.0%",
      latency: "18ms",
      p99: "44ms",
      load: "19%",
      notes: "Canonical mapping layer for incoming heterogenous payloads",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Server className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Infrastructure Telemetry & Observability
            </span>
            <span className="badge badge-success text-[10px] font-mono">ALL SYSTEMS OPERATIONAL</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            System Observability & Component Health
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Real-time status of backend services, database replica latency, WebSocket brokers, Redis queues, and AI tool latency.
          </p>
        </div>

        <button
          onClick={() => triggerAiPrompt("Audit system performance logs and identify any latent bottlenecks")}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Audit Health with Green AI</span>
        </button>
      </div>

      {/* Cluster Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Overall Platform Uptime</div>
          <div className="kpi-value text-gt-green mt-1">99.98%</div>
          <div className="text-[10px] text-gt-muted font-mono mt-1">Last incident: 42 days ago</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">API Request Throughput</div>
          <div className="kpi-value text-white mt-1">1,840 rpm</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">0.00% error rate</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Database Connection Pool</div>
          <div className="kpi-value text-white mt-1">6 / 20</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">Healthy headroom</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Live Active Sockets</div>
          <div className="kpi-value text-white mt-1">2 Clients</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">Ping interval: 15s</div>
        </div>
      </div>

      {/* Subsystem Health Table */}
      <div className="card overflow-hidden border border-gt-border">
        <div className="p-4 border-b border-gt-border flex items-center justify-between bg-gt-surface/50">
          <span className="text-xs font-mono text-gt-muted">
            Subsystem Health & Latency Telemetry
          </span>
          <span className="badge badge-outline text-[10px] font-mono">
            Structured Logging: structlog active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full text-left font-sans">
            <thead>
              <tr>
                <th className="font-mono text-[10px] text-gt-muted">Service / Subsystem</th>
                <th className="font-mono text-[10px] text-gt-muted">Status</th>
                <th className="font-mono text-[10px] text-gt-muted">Uptime</th>
                <th className="font-mono text-[10px] text-gt-muted">Median Latency</th>
                <th className="font-mono text-[10px] text-gt-muted">P99 Latency</th>
                <th className="font-mono text-[10px] text-gt-muted">Service Role & Architecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gt-border/40 text-xs">
              {services.map((svc, idx) => (
                <tr key={idx} className="hover:bg-gt-surface/60 transition-colors">
                  <td className="font-semibold text-white">{svc.name}</td>
                  <td>
                    <span
                      className={`badge text-[9px] font-mono ${
                        svc.status === "operational" ? "badge-success" : "badge-warning"
                      }`}
                    >
                      {svc.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-mono text-gt-green font-bold">{svc.uptime}</td>
                  <td className="font-mono text-white">{svc.latency}</td>
                  <td className="font-mono text-gt-text-2">{svc.p99}</td>
                  <td className="text-gt-muted text-[11px] max-w-sm">{svc.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
