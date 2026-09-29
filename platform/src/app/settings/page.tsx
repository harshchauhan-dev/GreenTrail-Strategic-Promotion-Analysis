"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Shield,
  Key,
  Users,
  Lock,
  Sliders,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const { demoMode, setDemoMode } = useStore();
  const [rateLimit, setRateLimit] = useState("1000");
  const [rbacEnforced, setRbacEnforced] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Security Governance & Policy Engine
            </span>
            <span className="badge badge-success text-[10px] font-mono">ENCRYPTED AT REST</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Platform Security, RBAC & Secret Management
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Configure enterprise role-based authorization, rate limiting, audit trail retention, and connector operating mode.
          </p>
        </div>
      </div>

      {/* Demo Mode Toggle Setting */}
      <div className="card p-5 border border-gt-border space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-gt-border">
          <div>
            <h2 className="text-sm font-semibold text-white">Connector Data Mode</h2>
            <p className="text-xs text-gt-muted mt-0.5">
              Toggle between realistic generated streaming demo data and live production connectors.
            </p>
          </div>
          <span
            className={`badge font-mono text-[10px] ${
              demoMode ? "badge-warning" : "badge-success"
            }`}
          >
            {demoMode ? "DEMO MODE (LIVE SYNTHETIC)" : "PRODUCTION (REAL APIS)"}
          </span>
        </div>

        <div className="p-4 rounded-lg bg-gt-surface border border-gt-border flex items-center justify-between">
          <div>
            <div className="font-semibold text-white text-xs">Enable Demo Mode Simulation</div>
            <div className="text-[11px] text-gt-muted mt-0.5">
              Generates sub-second realistic business events matching the canonical GreenTrail schema.
              Disable when real company credentials (REST API key / PostgreSQL URI) are active in <code>.env</code>.
            </div>
          </div>
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
              demoMode
                ? "bg-amber-400 text-black hover:bg-amber-300"
                : "bg-gt-green text-gt-black hover:bg-emerald-400"
            }`}
          >
            {demoMode ? "Switch to Production" : "Switch to Demo Mode"}
          </button>
        </div>
      </div>

      {/* Security Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 border border-gt-border space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gt-border">
            <Lock className="w-4 h-4 text-gt-green" />
            <h2 className="text-sm font-semibold text-white">Role-Based Access Control (RBAC)</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gt-surface border border-gt-border">
              <div>
                <div className="font-semibold text-white">Enforce Strict RBAC Guardrails</div>
                <div className="text-[11px] text-gt-muted">Only Superadmins can modify connector secrets</div>
              </div>
              <input
                type="checkbox"
                checked={rbacEnforced}
                onChange={(e) => setRbacEnforced(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gt-surface border border-gt-border">
              <div>
                <div className="font-semibold text-white">Immutable Audit Logging</div>
                <div className="text-[11px] text-gt-muted">Log all query executions, AI prompts, and data exports</div>
              </div>
              <input
                type="checkbox"
                checked={auditLogging}
                onChange={(e) => setAuditLogging(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>
          </div>
        </div>

        <div className="card p-5 border border-gt-border space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gt-border">
            <Sliders className="w-4 h-4 text-gt-green" />
            <h2 className="text-sm font-semibold text-white">API Rate Limiting & Gateway Quotas</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gt-muted font-mono mb-1">Max Requests Per Minute (Per Token)</label>
              <select
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                className="select w-full"
              >
                <option value="500">500 rpm (Standard Tier)</option>
                <option value="1000">1,000 rpm (Enterprise Tier)</option>
                <option value="5000">5,000 rpm (High Throughput Dedicated)</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-gt-surface border border-gt-border text-[11px] text-gt-muted font-mono">
              Rate limiting enforces token bucket algorithm in Redis to prevent connector degradation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
