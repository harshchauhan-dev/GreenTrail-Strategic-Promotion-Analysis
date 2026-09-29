"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Building2,
  TrendingUp,
  Users,
  Megaphone,
  Activity,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Database,
  Layers,
  Zap,
} from "lucide-react";

export default function Company360Page() {
  const { kpis, connectionStatus, demoMode, insights, alerts } = useStore();
  const { triggerAiPrompt } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Corporate Intelligence 360°
            </span>
            <span className="badge badge-success text-[10px] font-mono">AUTHORIZED COMPANY VIEW</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            GreenTrail Technologies Pvt. Ltd. — Enterprise Matrix
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Single unified view across finances, customer retention, marketing ROI, real-time operations, and pipeline health.
          </p>
        </div>

        <button
          onClick={() => triggerAiPrompt("Generate a comprehensive Company 360 Executive Briefing for board review")}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2 shadow-lg shadow-gt-green/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate Executive Brief</span>
        </button>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Financials */}
        <div className="card p-4 border border-gt-border">
          <div className="flex items-center justify-between text-xs text-gt-muted">
            <span>FINANCIAL RUN-RATE</span>
            <TrendingUp className="w-3.5 h-3.5 text-gt-green" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            ₹{kpis.revenueLakhs.toFixed(2)}L
          </div>
          <div className="text-xs text-gt-green mt-1 flex items-center gap-1 font-mono">
            <span>+14.2% MoM growth</span>
          </div>
          <div className="mt-3 pt-2 border-t border-gt-border text-[11px] text-gt-muted space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Gross Margin:</span>
              <span className="text-white font-bold">78.4%</span>
            </div>
            <div className="flex justify-between">
              <span>Net ARR:</span>
              <span className="text-white font-bold">₹3.88 Cr</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Customers */}
        <div className="card p-4 border border-gt-border">
          <div className="flex items-center justify-between text-xs text-gt-muted">
            <span>CUSTOMER BASE</span>
            <Users className="w-3.5 h-3.5 text-gt-green" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            {kpis.activeUsers.toLocaleString()}
          </div>
          <div className="text-xs text-gt-green mt-1 flex items-center gap-1 font-mono">
            <span>94.2% Net Retention</span>
          </div>
          <div className="mt-3 pt-2 border-t border-gt-border text-[11px] text-gt-muted space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Avg LTV:</span>
              <span className="text-white font-bold">₹1.85L</span>
            </div>
            <div className="flex justify-between">
              <span>Churn Risk:</span>
              <span className="text-gt-green font-bold">Low (2.8%)</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Marketing */}
        <div className="card p-4 border border-gt-border">
          <div className="flex items-center justify-between text-xs text-gt-muted">
            <span>MARKETING ATTRIBUTION</span>
            <Megaphone className="w-3.5 h-3.5 text-gt-green" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            4.2x Blended ROI
          </div>
          <div className="text-xs text-gt-green mt-1 flex items-center gap-1 font-mono">
            <span>Blended CAC: ₹480</span>
          </div>
          <div className="mt-3 pt-2 border-t border-gt-border text-[11px] text-gt-muted space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Active Campaigns:</span>
              <span className="text-white font-bold">6 channels</span>
            </div>
            <div className="flex justify-between">
              <span>Ad Spend (MTD):</span>
              <span className="text-white font-bold">₹4.20L</span>
            </div>
          </div>
        </div>

        {/* Pillar 4: Telemetry & SLA */}
        <div className="card p-4 border border-gt-border">
          <div className="flex items-center justify-between text-xs text-gt-muted">
            <span>PIPELINE HEALTH</span>
            <Activity className="w-3.5 h-3.5 text-gt-green" />
          </div>
          <div className="text-2xl font-bold text-gt-green font-mono mt-2">
            99.98%
          </div>
          <div className="text-xs text-gt-muted mt-1 flex items-center gap-1 font-mono">
            <span>Latency: {kpis.latencyMs}ms</span>
          </div>
          <div className="mt-3 pt-2 border-t border-gt-border text-[11px] text-gt-muted space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Active Connectors:</span>
              <span className="text-white font-bold">6 Connected</span>
            </div>
            <div className="flex justify-between">
              <span>Normalized Schema:</span>
              <span className="text-gt-green font-bold">Valid v2.4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sections: Operations + AI Synthesis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-Time Operational Signals */}
        <div className="card p-5 border border-gt-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gt-border">
            <h2 className="text-sm font-semibold text-white">Live Operations Matrix</h2>
            <Link href="/live" className="text-xs text-gt-green hover:underline font-mono">
              View Stream →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-gt-surface border border-gt-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Booking Velocity</div>
                <div className="text-[11px] text-gt-muted">14.2 bookings/minute during peak hours</div>
              </div>
              <span className="badge badge-success text-[10px] font-mono">+18% Peak</span>
            </div>

            <div className="p-3 rounded-lg bg-gt-surface border border-gt-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Payment Gateway Settlement Rate</div>
                <div className="text-[11px] text-gt-muted">Razorpay & UPI webhook processing</div>
              </div>
              <span className="text-xs font-mono font-bold text-gt-green">98.9% Success</span>
            </div>

            <div className="p-3 rounded-lg bg-gt-surface border border-gt-border flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Customer Support SLA</div>
                <div className="text-[11px] text-gt-muted">Freshdesk / Zendesk webhook sync</div>
              </div>
              <span className="text-xs font-mono font-bold text-gt-green">4.2 min avg</span>
            </div>
          </div>
        </div>

        {/* Company AI Insights & Anomalies */}
        <div className="card p-5 border border-gt-border space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gt-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gt-green" />
              <h2 className="text-sm font-semibold text-white">AI Cross-Functional Correlation</h2>
            </div>
            <button
              onClick={() => triggerAiPrompt("Analyze cross-functional correlations between ad spend and booking velocity")}
              className="text-xs text-gt-green hover:underline font-mono"
            >
              Correlate with AI →
            </button>
          </div>

          <div className="space-y-3">
            {insights.slice(0, 2).map((ins) => (
              <div key={ins.id} className="p-3.5 rounded-lg bg-gt-surface border border-gt-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{ins.title}</span>
                  <span className="text-[10px] text-gt-muted font-mono">{ins.timestamp}</span>
                </div>
                <p className="text-xs text-gt-text-2 mt-1.5 leading-relaxed">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
