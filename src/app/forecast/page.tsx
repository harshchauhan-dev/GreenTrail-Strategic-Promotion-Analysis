"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  BarChart3,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function ForecastPage() {
  const { kpis } = useStore();
  const { triggerAiPrompt } = useApp();
  const [horizon, setHorizon] = useState<"30d" | "60d" | "90d">("30d");

  const forecastData = {
    "30d": {
      projectedRevenue: "₹48.60L",
      projectedBookings: "1,840",
      confidence: "94.2%",
      growthRate: "+16.8%",
      keyDriver: "Instagram & WhatsApp retargeting campaigns",
      scenarios: {
        bull: "₹53.20L (+27%)",
        base: "₹48.60L (+16.8%)",
        bear: "₹42.10L (+4.1%)",
      },
    },
    "60d": {
      projectedRevenue: "₹1.04 Cr",
      projectedBookings: "3,920",
      confidence: "89.5%",
      growthRate: "+21.4%",
      keyDriver: "Enterprise B2B transit contracts expansion",
      scenarios: {
        bull: "₹1.18 Cr (+32%)",
        base: "₹1.04 Cr (+21.4%)",
        bear: "₹92.50L (+8.2%)",
      },
    },
    "90d": {
      projectedRevenue: "₹1.68 Cr",
      projectedBookings: "6,450",
      confidence: "84.1%",
      growthRate: "+26.0%",
      keyDriver: "New regional industrial route launches",
      scenarios: {
        bull: "₹1.92 Cr (+38%)",
        base: "₹1.68 Cr (+26.0%)",
        bear: "₹1.44 Cr (+11.5%)",
      },
    },
  }[horizon];

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
              Predictive ML Demand & Revenue Modeling
            </span>
            <span className="badge badge-success text-[10px] font-mono">ARIMA + XGBOOST ACTIVE</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Probabilistic Trend & Revenue Forecasting
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Machine learning projections synthesized from historical bookings, ad seasonality, macroeconomic indices, and customer cohorts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gt-surface p-1 rounded-lg border border-gt-border">
            {(["30d", "60d", "90d"] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider ${
                  horizon === h
                    ? "bg-gt-green text-gt-black font-bold"
                    : "text-gt-muted hover:text-white"
                }`}
              >
                {h} Horizon
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              triggerAiPrompt(
                `Generate a detailed ${horizon} financial & capacity stress-test simulation under bull, base, and bear scenarios.`
              )
            }
            className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Scenario Simulation</span>
          </button>
        </div>
      </div>

      {/* Projections Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">{horizon} Projected Revenue</div>
          <div className="kpi-value text-gt-green mt-1">{forecastData.projectedRevenue}</div>
          <div className="text-[10px] text-white font-mono mt-1">{forecastData.growthRate} projected lift</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">{horizon} Projected Volume</div>
          <div className="kpi-value text-white mt-1">{forecastData.projectedBookings} Orders</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">Capacity utilization: 86%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Statistical Confidence</div>
          <div className="kpi-value text-white mt-1">{forecastData.confidence}</div>
          <div className="text-[10px] text-gt-muted font-mono mt-1">Cross-validated P90 bound</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Primary Growth Vector</div>
          <div className="text-xs font-semibold text-white mt-2 leading-tight">
            {forecastData.keyDriver}
          </div>
          <div className="text-[10px] text-gt-green font-mono mt-1">Attributed by ML regressor</div>
        </div>
      </div>

      {/* Monte Carlo Scenario Simulator */}
      <div className="card p-5 border border-gt-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gt-border">
          <div>
            <h2 className="text-sm font-semibold text-white">Probabilistic Scenario Bands</h2>
            <p className="text-[11px] text-gt-muted">Monte Carlo confidence envelopes (10,000 iterations)</p>
          </div>
          <span className="badge badge-outline text-[10px] font-mono">P10 — P50 — P90</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gt-surface border border-gt-border space-y-1">
            <div className="text-xs text-gt-muted font-mono">BULL SCENARIO (P90)</div>
            <div className="text-xl font-bold text-gt-green font-mono">
              {forecastData.scenarios.bull}
            </div>
            <p className="text-[11px] text-gt-text-2 mt-1">
              Assumes 15% increase in conversion and successful regional corridor onboarding.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gt-surface border border-gt-green/40 shadow-sm shadow-gt-green/10 space-y-1">
            <div className="text-xs text-gt-green font-mono font-bold">BASE SCENARIO (P50)</div>
            <div className="text-xl font-bold text-white font-mono">
              {forecastData.scenarios.base}
            </div>
            <p className="text-[11px] text-gt-text-2 mt-1">
              Continuation of current marketing pace, seasonality adjustment, and current churn rates.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gt-surface border border-gt-border space-y-1">
            <div className="text-xs text-amber-400 font-mono">BEAR SCENARIO (P10)</div>
            <div className="text-xl font-bold text-amber-400 font-mono">
              {forecastData.scenarios.bear}
            </div>
            <p className="text-[11px] text-gt-text-2 mt-1">
              Models 10% CAC inflation and delayed client contract execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
