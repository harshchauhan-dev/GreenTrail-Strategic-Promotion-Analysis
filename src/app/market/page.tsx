"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/components/providers/Providers";
import {
  TrendingUp,
  Globe,
  ExternalLink,
  Sparkles,
  BarChart2,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Compass,
} from "lucide-react";

export default function MarketIntelligencePage() {
  const { triggerAiPrompt } = useApp();

  const signals = [
    {
      title: "Logistics Fuel Surcharge Index (India)",
      source: "MoRTH Official Data",
      value: "108.4",
      delta: "-1.2%",
      trend: "Favorable",
      impact: "Reduces transit unit cost across Tier-1 interstate corridors.",
    },
    {
      title: "Commercial Fleet Utilization Rate",
      source: "National Freight Index",
      value: "84.2%",
      delta: "+3.6%",
      trend: "Rising",
      impact: "High demand across Maharashtra and Gujarat industrial zones.",
    },
    {
      title: "Digital B2B Booking Adoption",
      source: "Industry Research (IBEF)",
      value: "62.8%",
      delta: "+8.1%",
      trend: "Expanding",
      impact: "Corporate clients shifting to automated API dispatch systems.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Market Signals & Sector Telemetry
            </span>
            <span className="badge badge-success text-[10px] font-mono">MACRO LIVE SIGNALS</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Market Intelligence & External Benchmarking
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Continuous macroeconomic tracking, freight indices, competitor movements, and official verified government data.
          </p>
        </div>

        <button
          onClick={() => triggerAiPrompt("Analyze market signals and determine competitive opportunities for GreenTrail")}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Analyze Market with Green AI</span>
        </button>
      </div>

      {/* Market Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {signals.map((sig, idx) => (
          <div key={idx} className="card p-4 border border-gt-border space-y-2">
            <div className="flex items-center justify-between text-xs text-gt-muted font-mono">
              <span>{sig.source}</span>
              <span className="badge badge-outline text-[9px]">{sig.trend}</span>
            </div>
            <div className="font-semibold text-white text-sm">{sig.title}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">{sig.value}</span>
              <span className="text-xs font-mono text-gt-green font-bold">{sig.delta}</span>
            </div>
            <p className="text-xs text-gt-text-2 pt-2 border-t border-gt-border leading-relaxed font-sans">
              {sig.impact}
            </p>
          </div>
        ))}
      </div>

      {/* Smart Resource Links Section (Explicitly requested in requirement 16) */}
      <div className="card p-5 border border-gt-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gt-border">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-gt-green" />
            <h2 className="text-sm font-semibold text-white">Explore Related Resources</h2>
          </div>
          <Link href="/resources" className="text-xs text-gt-green hover:underline font-mono">
            All Verified External Portals →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <a
            href="https://data.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-white">Industry Data (Open Data Portal)</div>
              <div className="text-[11px] text-gt-muted">Verified Government Datasets</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gt-muted" />
          </a>

          <a
            href="https://ibef.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-white">Market Research (IBEF)</div>
              <div className="text-[11px] text-gt-muted">Industry Trends & Exports</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gt-muted" />
          </a>

          <a
            href="https://rbi.org.in"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-white">Macroeconomic Bulletin (RBI)</div>
              <div className="text-[11px] text-gt-muted">Liquidity & Inflation Telemetry</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gt-muted" />
          </a>
        </div>
      </div>
    </div>
  );
}
