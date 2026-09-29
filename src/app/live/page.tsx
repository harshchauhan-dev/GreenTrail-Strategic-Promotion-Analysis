"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Radio,
  Activity,
  Filter,
  RefreshCw,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export default function LivePage() {
  const { liveEvents, kpis, connectionStatus, lastUpdate, reconnectWebSocket } = useStore();
  const { triggerAiPrompt } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const categories = ["all", "transaction", "booking", "anomaly", "campaign", "system"];

  const filteredEvents = liveEvents.filter((e) => {
    const matchCat = selectedCategory === "all" || e.category === selectedCategory;
    const matchSearch =
      !searchTerm ||
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.source && e.source.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Continuous Event Stream
            </span>
            <span className="badge badge-success text-[10px] font-mono">
              {connectionStatus === "connected" ? "LIVE ● 100% INGESTION RATE" : "RECONNECTING"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Real-Time Telemetry & Event Ingestion
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Streaming normalized events across REST webhooks, Kafka/Redis queues, PostgreSQL WAL, and company APIs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reconnectWebSocket}
            className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Sync</span>
          </button>
          <button
            onClick={() => triggerAiPrompt("Scan the current live event stream for micro-anomalies in the last 15 minutes")}
            className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Anomaly Scan</span>
          </button>
        </div>
      </div>

      {/* Stream Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Ingestion Throughput</div>
          <div className="kpi-value text-white mt-1">
            {kpis.eventsPerSec} <span className="text-xs text-gt-muted">ev/sec</span>
          </div>
          <div className="text-[10px] text-gt-green font-mono mt-1">
            ~{kpis.eventsPerSec * 60} events/min
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">P95 Network Latency</div>
          <div className="kpi-value text-white mt-1">{kpis.latencyMs}ms</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">SLA Target &lt;150ms</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Active Socket Channels</div>
          <div className="kpi-value text-white mt-1">4 Channels</div>
          <div className="text-[10px] text-gt-muted font-mono mt-1">/ws/live, /ws/alerts, /ws/activity, /ws/presence</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Buffer Health</div>
          <div className="kpi-value text-gt-green mt-1">100%</div>
          <div className="text-[10px] text-gt-muted font-mono mt-1">Zero dropped packets</div>
        </div>
      </div>

      {/* Stream Filter Bar */}
      <div className="card p-3 flex flex-col md:flex-row items-center justify-between gap-3 border border-gt-border">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                selectedCategory === cat
                  ? "bg-gt-green text-gt-black font-bold"
                  : "bg-gt-surface text-gt-muted hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter event title, payload, source..."
            className="input text-xs py-1.5 w-full md:w-64"
          />
        </div>
      </div>

      {/* Live Event Table */}
      <div className="card overflow-hidden border border-gt-border">
        <div className="p-4 border-b border-gt-border flex items-center justify-between bg-gt-surface/50">
          <div className="flex items-center gap-2 text-xs font-mono text-gt-muted">
            <Activity className="w-3.5 h-3.5 text-gt-green" />
            <span>Showing {filteredEvents.length} normalized stream events</span>
          </div>
          <span className="text-[11px] text-gt-subtle font-mono">
            {lastUpdate ? `Last event received: ${new Date(lastUpdate).toLocaleTimeString()}` : "Receiving..."}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full text-left font-sans">
            <thead>
              <tr>
                <th className="font-mono text-[10px] text-gt-muted">Timestamp</th>
                <th className="font-mono text-[10px] text-gt-muted">Category</th>
                <th className="font-mono text-[10px] text-gt-muted">Event Summary</th>
                <th className="font-mono text-[10px] text-gt-muted">Value</th>
                <th className="font-mono text-[10px] text-gt-muted">Source Connector</th>
                <th className="font-mono text-[10px] text-gt-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gt-border/40 text-xs">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-gt-surface/60 transition-colors">
                  <td className="font-mono text-gt-muted text-[11px] whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td>
                    <span
                      className={`badge text-[9px] font-mono ${
                        evt.category === "transaction"
                          ? "badge-success"
                          : evt.category === "booking"
                          ? "badge-outline"
                          : evt.category === "anomaly"
                          ? "badge-warning"
                          : "badge-outline"
                      }`}
                    >
                      {(evt.category || "event").toUpperCase()}
                    </span>
                  </td>
                  <td className="font-medium text-white max-w-md">{evt.title}</td>
                  <td className="font-mono text-gt-green font-bold">
                    {evt.amount ? `₹${evt.amount.toLocaleString()}` : "—"}
                  </td>
                  <td className="font-mono text-gt-subtle text-[11px]">{evt.source || "company_api"}</td>
                  <td>
                    <button
                      onClick={() => triggerAiPrompt(`Explain event: ${evt.title} (Category: ${evt.category}, Source: ${evt.source})`)}
                      className="text-[11px] text-gt-green hover:underline flex items-center gap-1 font-mono"
                    >
                      <Sparkles className="w-3 h-3" />
                      Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
