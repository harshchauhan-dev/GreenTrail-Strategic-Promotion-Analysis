"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Users,
  Search,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function CustomersPage() {
  const { customers, demoMode } = useStore();
  const { triggerAiPrompt } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.includes(searchTerm);
    const matchTier = tierFilter === "all" || c.tier.toLowerCase() === tierFilter.toLowerCase();
    return matchSearch && matchTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Customer Intelligence & Churn AI
            </span>
            <span className="badge badge-success text-[10px] font-mono">AUTHORIZED DATA</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Enterprise Accounts & Customer Retention 360°
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Real-time customer engagement scoring, LTV analysis, booking history, and predictive churn risk assessment.
          </p>
        </div>

        <button
          onClick={() => triggerAiPrompt("Scan all customer accounts for high churn risk and generate retention interventions")}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Predict Churn with Green AI</span>
        </button>
      </div>

      {/* Cohort KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Accounts Tracked</div>
          <div className="kpi-value text-white mt-1">{customers.length} Accounts</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">100% Normalized</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Average LTV</div>
          <div className="kpi-value text-white mt-1">₹3.61L</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">+12.4% vs last quarter</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Net Retention Rate (NRR)</div>
          <div className="kpi-value text-white mt-1">118%</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">Enterprise benchmark top decile</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">High Churn Risk Accounts</div>
          <div className="kpi-value text-amber-400 mt-1">1 Account</div>
          <div className="text-[10px] text-gt-muted font-mono mt-1">Action recommended</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-3 flex flex-col md:flex-row items-center justify-between gap-3 border border-gt-border">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {["all", "enterprise", "growth"].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider ${
                tierFilter === t
                  ? "bg-gt-green text-gt-black font-bold"
                  : "bg-gt-surface text-gt-muted hover:text-white"
              }`}
            >
              {t} Tier
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search name, company, ID, email..."
          className="input text-xs py-1.5 w-full md:w-72"
        />
      </div>

      {/* Customer Directory Table */}
      <div className="card overflow-hidden border border-gt-border">
        <div className="overflow-x-auto">
          <table className="table w-full text-left font-sans">
            <thead>
              <tr>
                <th className="font-mono text-[10px] text-gt-muted">Account & ID</th>
                <th className="font-mono text-[10px] text-gt-muted">Tier</th>
                <th className="font-mono text-[10px] text-gt-muted">Lifetime Value</th>
                <th className="font-mono text-[10px] text-gt-muted">Bookings</th>
                <th className="font-mono text-[10px] text-gt-muted">Churn Risk (AI)</th>
                <th className="font-mono text-[10px] text-gt-muted">Last Active</th>
                <th className="font-mono text-[10px] text-gt-muted">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gt-border/40 text-xs">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-gt-surface/60 transition-colors">
                  <td>
                    <div>
                      <div className="font-semibold text-white">{cust.name}</div>
                      <div className="text-[11px] text-gt-muted flex items-center gap-1.5">
                        <span>{cust.company}</span>
                        <span>•</span>
                        <span className="font-mono text-gt-subtle">#{cust.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge text-[9px] font-mono ${
                        cust.tier === "Enterprise" ? "badge-success" : "badge-outline"
                      }`}
                    >
                      {cust.tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-mono text-white font-bold">
                    ₹{cust.ltv.toLocaleString()}
                  </td>
                  <td className="font-mono text-gt-text-2">{cust.totalBookings} orders</td>
                  <td>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cust.churnRisk < 0.25
                            ? "bg-gt-green"
                            : cust.churnRisk < 0.5
                            ? "bg-amber-400"
                            : "bg-rose-500"
                        }`}
                      />
                      <span
                        className={
                          cust.churnRisk < 0.25
                            ? "text-gt-green"
                            : cust.churnRisk < 0.5
                            ? "text-amber-400"
                            : "text-rose-400 font-bold"
                        }
                      >
                        {Math.round(cust.churnRisk * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="font-mono text-gt-muted text-[11px]">{cust.lastActive}</td>
                  <td>
                    <Link
                      href={`/customers/${cust.id}`}
                      className="btn btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1 text-gt-green hover:border-gt-green"
                    >
                      <span>360° Profile</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
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
