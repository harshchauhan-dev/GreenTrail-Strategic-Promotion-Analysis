"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Radio,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Layers,
  Building2,
  Users,
  Megaphone,
  Database,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Search,
} from "lucide-react";

export default function OverviewPage() {
  const {
    kpis,
    lastUpdate,
    connectionStatus,
    demoMode,
    liveEvents,
    insights,
    alerts,
    reconnectWebSocket,
  } = useStore();
  const { triggerAiPrompt } = useApp();

  const [activeTab, setActiveTab] = useState<"telemetry" | "signals" | "agents">("telemetry");

  const revenueDelta = "+14.2%";
  const usersDelta = "+8.6%";
  const bookingsDelta = "+11.4%";

  return (
    <div className="space-y-6">
      {/* Top Banner / System Telemetry Header */}
      <div className="card p-5 relative overflow-hidden bg-gradient-to-r from-gt-surface via-gt-card to-gt-surface border border-gt-border">
        <div className="absolute top-0 right-0 w-96 h-full bg-gt-green/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold tracking-widest text-gt-green uppercase">
                GreenTrail Live Intelligence Platform
              </span>
              <span className="badge badge-success text-[10px] font-mono">
                {connectionStatus === "connected" ? "● SYSTEM ONLINE" : "● OFFLINE"}
              </span>
              {demoMode && (
                <span className="badge badge-warning text-[10px] font-mono">
                  DEMO CONNECTOR ACTIVE
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              Live Company Intelligence Command
            </h1>
            <p className="text-xs text-gt-muted mt-1 max-w-2xl font-sans">
              Continuous normalized ingestion across company APIs, Webhooks, PostgreSQL, CRM, and marketing platforms.
              Telemetry streams at sub-second latency with real-time anomaly detection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-2 rounded-lg bg-gt-surface border border-gt-border font-mono text-xs">
              <div className="text-[10px] text-gt-muted uppercase">Connected Sources</div>
              <div className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-gt-green" />
                <span>12 Sources</span>
              </div>
            </div>

            <div className="px-3 py-2 rounded-lg bg-gt-surface border border-gt-border font-mono text-xs">
              <div className="text-[10px] text-gt-muted uppercase">Throughput</div>
              <div className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                <Activity className="w-3.5 h-3.5 text-gt-green animate-pulse" />
                <span>{kpis.eventsPerSec * 60} events/min</span>
              </div>
            </div>

            <button
              onClick={() => triggerAiPrompt("Run a comprehensive health and revenue diagnosis on today's telemetry")}
              className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2 shadow-lg shadow-gt-green/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diagnose with Green AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Revenue */}
        <div className="kpi-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="kpi-label">Gross Revenue (Today)</span>
            <span className="live-dot" />
          </div>
          <div className="kpi-value text-white mt-1">
            ₹{kpis.revenueLakhs.toFixed(2)}L
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gt-border/40 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-gt-green">
              <TrendingUp className="w-3 h-3" />
              {revenueDelta} vs 7d avg
            </span>
            <span className="text-gt-muted text-[10px]">
              {lastUpdate ? `Updated ${Math.max(1, Math.round((Date.now() - new Date(lastUpdate).getTime()) / 1000))}s ago` : "Syncing..."}
            </span>
          </div>
        </div>

        {/* KPI: Active Users */}
        <div className="kpi-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="kpi-label">Active Concurrent Users</span>
            <span className="live-dot" />
          </div>
          <div className="kpi-value text-white mt-1">
            {kpis.activeUsers.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gt-border/40 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-gt-green">
              <TrendingUp className="w-3 h-3" />
              {usersDelta} peak hours
            </span>
            <span className="badge badge-success text-[9px] py-0">LIVE FEED</span>
          </div>
        </div>

        {/* KPI: Completed Bookings */}
        <div className="kpi-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="kpi-label">Live Bookings</span>
            <span className="live-dot" />
          </div>
          <div className="kpi-value text-white mt-1">
            {kpis.bookings.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gt-border/40 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-gt-green">
              <TrendingUp className="w-3 h-3" />
              {bookingsDelta} conversion
            </span>
            <span className="text-gt-muted text-[10px]">P95 Latency 91ms</span>
          </div>
        </div>

        {/* KPI: Telemetry Health */}
        <div className="kpi-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="kpi-label">Ingestion Telemetry</span>
            <span className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-gt-green animate-pulse" : "bg-rose-500"}`} />
          </div>
          <div className="kpi-value text-white mt-1">
            {kpis.eventsPerSec} <span className="text-xs font-normal text-gt-muted">ev/sec</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gt-border/40 text-[11px] font-mono">
            <span className="text-gt-green">
              Latency: {kpis.latencyMs}ms
            </span>
            <span className="text-gt-muted text-[10px]">Freshness: 1.8s</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide): Live Operations & Autonomous AI Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Autonomous AI Insights Panel */}
          <div className="card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gt-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-gt-green/20 text-gt-green">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white font-sans">
                    Autonomous Green AI Insights
                  </h2>
                  <p className="text-[11px] text-gt-muted">Continuous event stream correlation & anomaly detection</p>
                </div>
              </div>
              <Link
                href="/insights"
                className="text-xs text-gt-green hover:underline flex items-center gap-1 font-mono"
              >
                <span>Full Feed</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3.5 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge text-[9px] font-mono ${
                          insight.type === "anomaly"
                            ? "badge-warning"
                            : insight.type === "opportunity"
                            ? "badge-success"
                            : "badge-outline"
                        }`}
                      >
                        {insight.type.toUpperCase()}
                      </span>
                      <h3 className="text-xs font-semibold text-white">{insight.title}</h3>
                    </div>
                    <span className="text-[10px] text-gt-muted font-mono">{insight.timestamp}</span>
                  </div>

                  <p className="text-xs text-gt-text-2 mt-2 leading-relaxed font-sans">
                    {insight.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gt-border/40 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gt-muted font-mono">Confidence:</span>
                      <span className="text-xs font-bold text-gt-green font-mono">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => triggerAiPrompt(`Investigate: ${insight.title}. ${insight.description}`)}
                        className="btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 text-gt-green"
                      >
                        <Sparkles className="w-3 h-3" />
                        Investigate
                      </button>
                      <Link
                        href={insight.actionUrl || "/insights"}
                        className="btn btn-ghost text-[11px] py-1 px-2 text-gt-text-2 hover:text-white"
                      >
                        Explore →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-Time Live Activity Stream */}
          <div className="card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gt-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-gt-green/20 text-gt-green">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white font-sans">
                    Live Event & Activity Stream
                  </h2>
                  <p className="text-[11px] text-gt-muted">Real-time normalized stream via WebSocket / SSE</p>
                </div>
              </div>
              <Link
                href="/live"
                className="text-xs text-gt-green hover:underline flex items-center gap-1 font-mono"
              >
                <span>Full Telemetry</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2 mt-4 max-h-80 overflow-y-auto font-mono text-xs">
              {liveEvents.length === 0 ? (
                <div className="text-center py-8 text-gt-muted">Connecting to WebSocket telemetry...</div>
              ) : (
                liveEvents.slice(0, 8).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded bg-gt-surface/70 border border-gt-border/60 flex items-center justify-between hover:bg-gt-surface transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gt-muted">{evt.timestamp}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          evt.category === "transaction"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : evt.category === "booking"
                            ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                            : evt.category === "anomaly"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-gt-card text-gt-text-2 border border-gt-border"
                        }`}
                      >
                        {(evt.category || "event").toUpperCase()}
                      </span>
                      <span className="text-white text-xs font-sans">{evt.title}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {evt.amount && (
                        <span className="text-gt-green font-bold text-xs">
                          +₹{evt.amount.toLocaleString()}
                        </span>
                      )}
                      <span className="text-[10px] text-gt-subtle">
                        {evt.source || "company_api"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col wide): Live Alert Center & Quick Nav Hub */}
        <div className="space-y-6">
          {/* Live Alert Center */}
          <div className="card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gt-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-500/20 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white font-sans">
                    Live Alert Center
                  </h2>
                  <p className="text-[11px] text-gt-muted">Triggered threshold conditions</p>
                </div>
              </div>
              <Link href="/alerts" className="text-xs text-gt-green hover:underline font-mono">
                All Alerts
              </Link>
            </div>

            <div className="space-y-2.5 mt-4">
              {alerts.length === 0 ? (
                <p className="text-xs text-gt-muted py-4 text-center">No active alerts</p>
              ) : (
                alerts.map((al) => (
                  <div
                    key={al.id}
                    className={`p-3 rounded-lg border text-xs ${
                      al.severity === "critical"
                        ? "bg-rose-950/20 border-rose-900/50 text-rose-200"
                        : al.severity === "warning"
                        ? "bg-amber-950/20 border-amber-900/50 text-amber-200"
                        : "bg-gt-surface border-gt-border text-gt-text-2"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{al.title}</span>
                      <span className="text-[10px] font-mono opacity-60">{al.timestamp}</span>
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed">{al.message}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                      <span>Source: {al.source}</span>
                      <button
                        onClick={() => triggerAiPrompt(`Diagnose alert: ${al.title}. ${al.message}`)}
                        className="text-gt-green hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Diagnose
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Nav / Company 360 Deep Links */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white pb-3 border-b border-gt-border font-sans">
              Quick Intelligence Jump
            </h2>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link
                href="/company"
                className="p-3 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 transition-colors flex flex-col justify-between"
              >
                <Building2 className="w-4 h-4 text-gt-green mb-2" />
                <div>
                  <div className="text-xs font-semibold text-white">Company 360</div>
                  <div className="text-[10px] text-gt-muted">Executive matrix</div>
                </div>
              </Link>

              <Link
                href="/market"
                className="p-3 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 transition-colors flex flex-col justify-between"
              >
                <TrendingUp className="w-4 h-4 text-gt-green mb-2" />
                <div>
                  <div className="text-xs font-semibold text-white">Market Intel</div>
                  <div className="text-[10px] text-gt-muted">Macro signals</div>
                </div>
              </Link>

              <Link
                href="/customers"
                className="p-3 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 transition-colors flex flex-col justify-between"
              >
                <Users className="w-4 h-4 text-gt-green mb-2" />
                <div>
                  <div className="text-xs font-semibold text-white">Customer 360</div>
                  <div className="text-[10px] text-gt-muted">Churn predictions</div>
                </div>
              </Link>

              <Link
                href="/campaigns"
                className="p-3 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 transition-colors flex flex-col justify-between"
              >
                <Megaphone className="w-4 h-4 text-gt-green mb-2" />
                <div>
                  <div className="text-xs font-semibold text-white">Campaigns</div>
                  <div className="text-[10px] text-gt-muted">Ad ROI & CAC</div>
                </div>
              </Link>

              <Link
                href="/data"
                className="p-3 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 transition-colors flex flex-col justify-between"
              >
                <Database className="w-4 h-4 text-gt-green mb-2" />
                <div>
                  <div className="text-xs font-semibold text-white">Data Explorer</div>
                  <div className="text-[10px] text-gt-muted">SQL queries & filters</div>
                </div>
              </Link>

              <Link
                href="/integrations"
                className="p-3 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 transition-colors flex flex-col justify-between"
              >
                <Zap className="w-4 h-4 text-gt-green mb-2" />
                <div>
                  <div className="text-xs font-semibold text-white">Connectors</div>
                  <div className="text-[10px] text-gt-muted">REST, DB, Webhooks</div>
                </div>
              </Link>
            </div>
          </div>

          {/* External Verified Resources Widget */}
          <div className="card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gt-border">
              <h2 className="text-sm font-semibold text-white font-sans">
                External Verified Resources
              </h2>
              <Link href="/resources" className="text-xs text-gt-green hover:underline font-mono">
                View All →
              </Link>
            </div>
            <div className="space-y-2 mt-3 text-xs">
              <a
                href="https://data.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded bg-gt-surface hover:bg-gt-border/40 text-gt-text-2 hover:text-white transition-colors"
              >
                <span>National Open Data Portal (India)</span>
                <ExternalLink className="w-3 h-3 text-gt-muted" />
              </a>
              <a
                href="https://rbi.org.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded bg-gt-surface hover:bg-gt-border/40 text-gt-text-2 hover:text-white transition-colors"
              >
                <span>Reserve Bank of India Macro Bulletin</span>
                <ExternalLink className="w-3 h-3 text-gt-muted" />
              </a>
              <a
                href="https://ibef.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded bg-gt-surface hover:bg-gt-border/40 text-gt-text-2 hover:text-white transition-colors"
              >
                <span>India Brand Equity Foundation Sector Insights</span>
                <ExternalLink className="w-3 h-3 text-gt-muted" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
