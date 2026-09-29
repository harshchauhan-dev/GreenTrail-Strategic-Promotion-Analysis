"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Send,
  Sliders,
  Mail,
  MessageSquare,
  Webhook,
  Filter,
} from "lucide-react";

export default function AlertsPage() {
  const { alerts } = useStore();
  const { triggerAiPrompt } = useApp();
  const [filterSeverity, setFilterSeverity] = useState("all");

  const filteredAlerts = alerts.filter(
    (a) => filterSeverity === "all" || a.severity === filterSeverity
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400">
              <Bell className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
              Real-Time Alert Dispatch
            </span>
            <span className="badge badge-warning text-[10px] font-mono">18 RULES ACTIVE</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Live Alert Center & Threshold Intelligence
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Automated event-driven anomaly notifications with direct webhooks to Slack, Microsoft Teams, PagerDuty, and email.
          </p>
        </div>

        <button
          onClick={() => triggerAiPrompt("Summarize all active alerts, identify common root causes, and propose remediation")}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Root-Cause Analysis with AI</span>
        </button>
      </div>

      {/* Dispatch Channels Strip */}
      <div className="card p-4 border border-gt-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gt-muted">
          <Send className="w-4 h-4 text-gt-green" />
          <span className="font-semibold text-white">Configured Notification Targets:</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Slack (#greentrail-alerts)
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Webhook (Enterprise API)
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Email (Ops On-Call)
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["all", "critical", "warning", "info", "success"].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider ${
              filterSeverity === sev
                ? "bg-gt-green text-gt-black font-bold"
                : "bg-gt-surface text-gt-muted hover:text-white"
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="card p-8 text-center text-gt-muted text-xs">
            No alerts matching the selected filter.
          </div>
        ) : (
          filteredAlerts.map((al) => (
            <div
              key={al.id}
              className={`card p-4 border transition-colors ${
                al.severity === "critical"
                  ? "bg-rose-950/20 border-rose-900/60"
                  : al.severity === "warning"
                  ? "bg-amber-950/20 border-amber-900/60"
                  : "bg-gt-surface border-gt-border"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gt-border/40">
                <div className="flex items-center gap-2">
                  <span
                    className={`badge text-[9px] font-mono ${
                      al.severity === "critical"
                        ? "badge-danger"
                        : al.severity === "warning"
                        ? "badge-warning"
                        : "badge-success"
                    }`}
                  >
                    {al.severity.toUpperCase()}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{al.title}</h3>
                </div>
                <span className="text-[11px] text-gt-muted font-mono">{al.timestamp}</span>
              </div>

              <p className="text-xs text-gt-text-1 mt-2 leading-relaxed">{al.message}</p>

              <div className="mt-3 pt-2 border-t border-gt-border/40 flex items-center justify-between text-[11px] font-mono">
                <span className="text-gt-muted">Source: {al.source}</span>
                <button
                  onClick={() => triggerAiPrompt(`Diagnose alert "${al.title}" from source "${al.source}": ${al.message}`)}
                  className="text-gt-green hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Diagnose with Green AI →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
