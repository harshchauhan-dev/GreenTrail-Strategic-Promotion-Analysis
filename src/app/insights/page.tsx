"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import Link from "next/link";

export default function InsightsPage() {
  const { insights } = useStore();
  const { triggerAiPrompt } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Autonomous AI Telemetry Agents
            </span>
            <span className="badge badge-success text-[10px] font-mono">CONTINUOUS DETECTION</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Autonomous Green AI Insights Engine
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Continuously analyzing incoming events, telemetry spikes, booking anomalies, and conversion shifts without requiring manual prompting.
          </p>
        </div>

        <button
          onClick={() => triggerAiPrompt("Perform a full multi-dimensional anomaly sweep across all connected databases and APIs")}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Trigger Real-Time Sweep</span>
        </button>
      </div>

      {/* Agents Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Anomaly Agent</div>
          <div className="text-xs font-mono font-bold text-gt-green mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gt-green animate-pulse" />
            SCANNING (P99 Z-SCORE)
          </div>
          <div className="text-[10px] text-gt-muted mt-1 font-mono">Last pass: 8s ago</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Forecast Agent</div>
          <div className="text-xs font-mono font-bold text-gt-green mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gt-green animate-pulse" />
            ACTIVE (ARIMA + PROPHET)
          </div>
          <div className="text-[10px] text-gt-muted mt-1 font-mono">Confidence: 94.8%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Alert Agent</div>
          <div className="text-xs font-mono font-bold text-gt-green mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gt-green animate-pulse" />
            EVALUATING 18 RULES
          </div>
          <div className="text-[10px] text-gt-muted mt-1 font-mono">0 critical breaches</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Data Quality Agent</div>
          <div className="text-xs font-mono font-bold text-gt-green mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gt-green animate-pulse" />
            SCHEMA VALIDATION OK
          </div>
          <div className="text-[10px] text-gt-muted mt-1 font-mono">100% normalized</div>
        </div>
      </div>

      {/* Insights Stream */}
      <div className="space-y-4">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="card p-5 border border-gt-border hover:border-gt-green/50 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gt-border">
              <div className="flex items-center gap-2">
                <span
                  className={`badge text-[9px] font-mono ${
                    ins.type === "anomaly"
                      ? "badge-warning"
                      : ins.type === "opportunity"
                      ? "badge-success"
                      : "badge-outline"
                  }`}
                >
                  {ins.type.toUpperCase()} DETECTED
                </span>
                <h3 className="text-sm font-semibold text-white">{ins.title}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-gt-muted">
                <Clock className="w-3 h-3" />
                <span>{ins.timestamp}</span>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs text-gt-text-1 leading-relaxed">{ins.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-gt-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-gt-muted font-mono text-[11px]">
                <span>
                  Model Confidence:{" "}
                  <strong className="text-gt-green">{Math.round(ins.confidence * 100)}%</strong>
                </span>
                <span>•</span>
                <span>Agent: Statistical Drift & Regressor</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    triggerAiPrompt(
                      `Conduct an end-to-end investigation into this insight: "${ins.title}". Description: "${ins.description}". Identify all contributing sources and propose corrective steps.`
                    )
                  }
                  className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Investigate with Green AI</span>
                </button>
                {ins.actionUrl && (
                  <Link
                    href={ins.actionUrl}
                    className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-gt-text-2 hover:text-white"
                  >
                    <span>Inspect Raw Data</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
