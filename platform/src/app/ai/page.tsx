"use client";

import React, { useState } from "react";
import { useApp } from "@/components/providers/Providers";
import {
  Sparkles,
  Bot,
  Shield,
  Activity,
  CheckCircle2,
  Lock,
  Play,
  FileText,
  Search,
  Zap,
  Terminal,
  Code2,
} from "lucide-react";

export default function AiStudioPage() {
  const { triggerAiPrompt } = useApp();
  const [selectedAgent, setSelectedAgent] = useState("analyst");

  const agents = [
    {
      id: "analyst",
      name: "Data Analyst Agent",
      role: "Metric Investigation & Multi-Dimensional Root-Cause",
      tools: ["query_metrics()", "calculate_cac_ltv()", "get_revenue()", "compare_periods()"],
      status: "Active",
      guardrails: "Read-only analytics replica • RBAC query constraints • 15s execution timeout",
      samplePrompt: "Why did gross booking margin decrease by 3.2% between Tuesday and Thursday?",
    },
    {
      id: "anomaly",
      name: "Anomaly Detection Agent",
      role: "Continuous Event Drift & Statistical Outliers",
      tools: ["detect_anomalies()", "scan_event_stream()", "flag_statistical_spike()"],
      status: "Active",
      guardrails: "P99 statistical deviation threshold • False-positive filter • Rate limited 60/min",
      samplePrompt: "Scan the last 1,000 transactions for localized fraud patterns or sudden ticket spikes.",
    },
    {
      id: "forecast",
      name: "Predictive Forecast Agent",
      role: "Demand Curves, Seasonality & Probabilistic Bands",
      tools: ["get_forecast()", "run_monte_carlo()", "calculate_capacity_ceiling()"],
      status: "Active",
      guardrails: "Cross-validated ARIMA + XGBoost models • P10/P50/P90 confidence bounds",
      samplePrompt: "Generate a 60-day demand forecast factoring in festive season advertising spend.",
    },
    {
      id: "report",
      name: "Executive Report Agent",
      role: "Automated Board Briefings & Dossier Generation",
      tools: ["generate_report()", "synthesize_executive_summary()", "format_pdf_dossier()"],
      status: "Active",
      guardrails: "Template governance • Audit log attribution • No write-access to company records",
      samplePrompt: "Synthesize an executive board dossier covering MTD financials, CAC, and operational SLA.",
    },
    {
      id: "research",
      name: "Public Research Agent",
      role: "Authorized Macro & Government Data Correlator",
      tools: ["search_verified_sources()", "fetch_macro_bulletin()", "verify_citation()"],
      status: "Active",
      guardrails: "Verified domain whitelist (data.gov.in, rbi.org.in, ibef.org) • Strict URL sanitization",
      samplePrompt: "Retrieve current interstate freight regulatory guidelines and assess impact on fleet costs.",
    },
    {
      id: "alert",
      name: "Alert & Notification Agent",
      role: "Threshold Trigger Evaluation & Multi-Channel Dispatch",
      tools: ["get_alerts()", "dispatch_webhook()", "format_slack_card()"],
      status: "Active",
      guardrails: "Human confirmation for high-severity alerts • Webhook payload signing",
      samplePrompt: "Test alert escalation rules for a simulated 20% booking drop across Mumbai operations.",
    },
  ];

  const currentAgent = agents.find((a) => a.id === selectedAgent) || agents[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Bot className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Autonomous Agent Governance Architecture
            </span>
            <span className="badge badge-success text-[10px] font-mono">GOVERNED LLM TOOLS</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Green AI Agent System & Function Calling Studio
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Strictly governed, role-restricted internal agents with verifiable citations, controlled backend tool execution, and complete audit logging.
          </p>
        </div>

        <button
          onClick={() => triggerAiPrompt(currentAgent.samplePrompt)}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Selected Agent</span>
        </button>
      </div>

      {/* Agents Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => setSelectedAgent(agent.id)}
            className={`card p-4 border cursor-pointer transition-all ${
              selectedAgent === agent.id
                ? "bg-gt-green/10 border-gt-green shadow-lg shadow-gt-green/10"
                : "bg-gt-surface border-gt-border hover:border-gt-border-l"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs">{agent.name}</span>
              <span className="badge badge-success text-[9px] font-mono">{agent.status}</span>
            </div>
            <p className="text-[11px] text-gt-muted mt-1 leading-normal">{agent.role}</p>
            <div className="mt-3 pt-2 border-t border-gt-border/40 flex items-center justify-between text-[10px] font-mono text-gt-subtle">
              <span>{agent.tools.length} Tools Bound</span>
              <span className="text-gt-green font-bold">RBAC Governed</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Agent Dossier */}
      <div className="card p-5 border border-gt-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gt-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gt-green" />
            <h2 className="text-sm font-semibold text-white">{currentAgent.name} Specification</h2>
          </div>
          <span className="badge badge-outline text-[10px] font-mono">SANDBOX ENCLAVE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-4 rounded-lg bg-gt-surface border border-gt-border space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-gt-green" />
              <span>Authorized Backend Tools</span>
            </div>
            <p className="text-gt-muted text-[11px]">
              The LLM has zero direct database write permissions. It can ONLY invoke these strictly typed backend functions:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentAgent.tools.map((t, i) => (
                <span key={i} className="px-2 py-1 rounded bg-gt-card border border-gt-border text-gt-green font-mono text-[10px]">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gt-surface border border-gt-border space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-gt-green" />
              <span>Safety & Governance Guardrails</span>
            </div>
            <p className="text-gt-muted text-[11px]">
              Every execution adheres to enterprise security parameters:
            </p>
            <div className="p-2 rounded bg-gt-card border border-gt-border text-[11px] text-white font-mono">
              {currentAgent.guardrails}
            </div>
          </div>
        </div>

        {/* Sample Interactive Execution */}
        <div className="p-4 rounded-lg bg-gt-surface border border-gt-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-gt-muted font-mono uppercase">Pre-Configured Scenario Prompt</div>
            <div className="text-xs text-white font-medium mt-0.5">"{currentAgent.samplePrompt}"</div>
          </div>
          <button
            onClick={() => triggerAiPrompt(currentAgent.samplePrompt)}
            className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute in Green AI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
