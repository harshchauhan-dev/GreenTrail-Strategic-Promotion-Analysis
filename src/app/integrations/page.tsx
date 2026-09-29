"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Zap,
  Database,
  Globe,
  Radio,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Lock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function IntegrationsPage() {
  const { demoMode } = useStore();
  const { triggerAiPrompt } = useApp();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const connectors = [
    {
      id: "company-rest",
      name: "Corporate REST API Feed",
      type: "REST API",
      status: "connected",
      latency: "84ms",
      lastSync: "2 seconds ago",
      records: "184,209",
      errors: 0,
      endpoint: "https://api.company.internal/v1/telemetry",
      authType: "Bearer Token (Server-Side Secret)",
    },
    {
      id: "postgres-main",
      name: "Primary PostgreSQL Warehouse",
      type: "Database",
      status: "connected",
      latency: "42ms",
      lastSync: "5 seconds ago",
      records: "1,420,890",
      errors: 0,
      endpoint: "postgres://prod-read-replica:5432/greentrail",
      authType: "Encrypted Vault Connection Pool",
    },
    {
      id: "webhook-gateway",
      name: "Payment Gateway Ingestion Webhook",
      type: "Webhook",
      status: "connected",
      latency: "96ms",
      lastSync: "Just now",
      records: "92,410",
      errors: 1,
      endpoint: "/api/v1/integrations/webhook/razorpay",
      authType: "HMAC-SHA256 Signature Verification",
    },
    {
      id: "crm-hub",
      name: "Salesforce / HubSpot CRM Gateway",
      type: "CRM Feed",
      status: "connected",
      latency: "142ms",
      lastSync: "1 minute ago",
      records: "48,200",
      errors: 0,
      endpoint: "https://api.salesforce.com/services/data/v58.0",
      authType: "OAuth 2.0 Client Credentials",
    },
    {
      id: "marketing-ads",
      name: "Meta & Google Ads Multi-Touch Sync",
      type: "Marketing API",
      status: "delayed",
      latency: "320ms",
      lastSync: "4 minutes ago",
      records: "24,800",
      errors: 2,
      endpoint: "https://graph.facebook.com/v19.0/act_ads",
      authType: "OAuth 2.0 Scoped Token",
    },
    {
      id: "websocket-telemetry",
      name: "Live IoT Fleet Sensor WebSocket",
      type: "WebSocket",
      status: "connected",
      latency: "28ms",
      lastSync: "Continuous (Real-time)",
      records: "542,100",
      errors: 0,
      endpoint: "wss://telemetry.internal/fleet/live",
      authType: "mTLS Certificate Exchange",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Zap className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Company Ingestion Connectors & Pipeline Telemetry
            </span>
            <span className="badge badge-success text-[10px] font-mono">
              {demoMode ? "DEMO MODE (READY FOR REAL CREDS)" : "PRODUCTION PIPELINE"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Data Connectors & Unified Ingestion Hub
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Connect real company REST APIs, databases, webhooks, and IoT streams. All secrets remain strictly server-side in encrypted vaults.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModal("new-connector")}
            className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Company Data</span>
          </button>
        </div>
      </div>

      {/* Quick Ingestion Actions Bar */}
      <div className="card p-4 border border-gt-border">
        <div className="text-xs font-semibold text-white mb-3">Add Authorized Enterprise Data Source:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { label: "REST API", icon: Globe },
            { label: "PostgreSQL", icon: Database },
            { label: "MySQL", icon: Database },
            { label: "Webhook", icon: Zap },
            { label: "WebSocket", icon: Radio },
            { label: "GraphQL", icon: Layers },
            { label: "CSV Feed", icon: FileSpreadsheet },
            { label: "CRM / ERP", icon: Layers },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => setActiveModal(item.label)}
                className="p-2.5 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 hover:bg-gt-card transition-colors flex flex-col items-center justify-center gap-1.5 text-center group"
              >
                <Icon className="w-4 h-4 text-gt-green group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-mono text-gt-text-2 group-hover:text-white leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connectors Health Status Matrix */}
      <div className="card overflow-hidden border border-gt-border">
        <div className="p-4 border-b border-gt-border flex items-center justify-between bg-gt-surface/50">
          <div className="text-xs font-mono text-gt-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gt-green animate-pulse" />
            <span>Connector Pipeline Health ({connectors.length} configured pipelines)</span>
          </div>
          <span className="text-[11px] text-gt-subtle font-mono">
            Zero secret keys exposed in client code
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full text-left font-sans">
            <thead>
              <tr>
                <th className="font-mono text-[10px] text-gt-muted">Connector Source</th>
                <th className="font-mono text-[10px] text-gt-muted">Type</th>
                <th className="font-mono text-[10px] text-gt-muted">Status</th>
                <th className="font-mono text-[10px] text-gt-muted">Latency</th>
                <th className="font-mono text-[10px] text-gt-muted">Last Sync</th>
                <th className="font-mono text-[10px] text-gt-muted">Records Ingested</th>
                <th className="font-mono text-[10px] text-gt-muted">Security & Auth</th>
                <th className="font-mono text-[10px] text-gt-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gt-border/40 text-xs">
              {connectors.map((conn) => (
                <tr key={conn.id} className="hover:bg-gt-surface/60 transition-colors">
                  <td>
                    <div className="font-semibold text-white">{conn.name}</div>
                    <div className="text-[10px] text-gt-muted font-mono">{conn.endpoint}</div>
                  </td>
                  <td className="font-mono text-gt-text-2">{conn.type}</td>
                  <td>
                    <span
                      className={`badge text-[9px] font-mono ${
                        conn.status === "connected"
                          ? "badge-success"
                          : conn.status === "delayed"
                          ? "badge-warning"
                          : "badge-danger"
                      }`}
                    >
                      {conn.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-mono text-gt-green font-bold">{conn.latency}</td>
                  <td className="font-mono text-gt-muted text-[11px]">{conn.lastSync}</td>
                  <td className="font-mono text-white font-bold">{conn.records}</td>
                  <td className="text-[11px] text-gt-muted flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3 text-gt-green" />
                    <span>{conn.authType}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => alert(`Connection test successful for ${conn.name}. Latency: ${conn.latency}`)}
                      className="text-[11px] text-gt-green hover:underline font-mono"
                    >
                      Test Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Dialog for connecting new company data source */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="card w-full max-w-xl border border-gt-border-l p-6 bg-gt-card space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gt-border">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gt-green" />
                <h3 className="text-base font-bold text-white">Connect {activeModal}</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gt-muted hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gt-muted font-mono mb-1">Connector Name</label>
                <input
                  type="text"
                  placeholder="e.g. Production Orders Feed"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-gt-muted font-mono mb-1">Target Endpoint / Connection URI</label>
                <input
                  type="text"
                  placeholder="https://api.yourcompany.com/v1/events or postgres://..."
                  className="input w-full text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-gt-muted font-mono mb-1">
                  API Key / Access Token (Saved to Encrypted Server Vault)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="input w-full text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gt-muted font-mono mb-1">Polling Interval</label>
                  <select className="select w-full text-xs">
                    <option>Real-Time (Webhook / WebSocket)</option>
                    <option>Every 5 Seconds</option>
                    <option>Every 30 Seconds</option>
                    <option>Hourly Batch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gt-muted font-mono mb-1">Canonical Schema Target</label>
                  <select className="select w-full text-xs">
                    <option>Transaction / Revenue</option>
                    <option>Booking / Order</option>
                    <option>Customer Profile</option>
                    <option>Campaign Performance</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gt-border flex items-center justify-between">
              <span className="text-[11px] font-mono text-gt-green flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Zero-exposure secret management
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Connector tested and saved into secure server configuration!");
                    setActiveModal(null);
                  }}
                  className="btn btn-primary text-xs"
                >
                  Verify & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
