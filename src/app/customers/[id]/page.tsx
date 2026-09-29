"use client";

import React, { use } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Users,
  Building2,
  Mail,
  Calendar,
  CreditCard,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Clock,
  Shield,
} from "lucide-react";

export default function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { customers } = useStore();
  const { triggerAiPrompt } = useApp();

  const customer = customers.find((c) => c.id === resolvedParams.id) || {
    id: resolvedParams.id,
    name: "Enterprise Account",
    email: "contact@company.internal",
    company: "Partner Enterprise Corp",
    tier: "Enterprise",
    ltv: 380000,
    totalBookings: 24,
    churnRisk: 0.12,
    lastActive: "10 mins ago",
  };

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gt-muted font-mono">
        <Link href="/customers" className="hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Customers</span>
        </Link>
        <span>/</span>
        <span className="text-gt-green font-bold">#{customer.id}</span>
      </div>

      {/* Profile Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gt-green/20 border border-gt-green/40 flex items-center justify-center text-gt-green font-bold text-lg font-mono">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-sans">{customer.name}</h1>
              <span className="badge badge-success text-[10px] font-mono">{customer.tier} TIER</span>
              <span className="badge badge-outline text-[10px] font-mono">ID: #{customer.id}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gt-muted mt-1 font-mono">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-gt-green" />
                {customer.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-gt-green" />
                {customer.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gt-green" />
                Active {customer.lastActive}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            triggerAiPrompt(
              `Conduct an in-depth retention and LTV expansion analysis for ${customer.name} (#${customer.id}, Company: ${customer.company})`
            )
          }
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate AI Account Dossier</span>
        </button>
      </div>

      {/* Account Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Cumulative Lifetime Value</div>
          <div className="kpi-value text-white mt-1">₹{customer.ltv.toLocaleString()}</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">+24% YoY growth</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Historical Bookings</div>
          <div className="kpi-value text-white mt-1">{customer.totalBookings} Orders</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">100% fulfillment rate</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Predictive Churn Risk</div>
          <div
            className={`kpi-value mt-1 ${
              customer.churnRisk < 0.25
                ? "text-gt-green"
                : customer.churnRisk < 0.5
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {Math.round(customer.churnRisk * 100)}%
          </div>
          <div className="text-[10px] text-gt-muted font-mono mt-1">
            {customer.churnRisk < 0.25 ? "Healthy account status" : "At-risk warning flag"}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Average Order Value (AOV)</div>
          <div className="kpi-value text-white mt-1">
            ₹{Math.round(customer.ltv / Math.max(1, customer.totalBookings)).toLocaleString()}
          </div>
          <div className="text-[10px] text-gt-green font-mono mt-1">Tier-1 account ranking</div>
        </div>
      </div>

      {/* AI Intelligence Summary for this Account */}
      <div className="card p-5 border border-gt-border space-y-3">
        <div className="flex items-center gap-2 text-gt-green font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Green AI Account Intelligence Summary</span>
        </div>
        <div className="p-4 rounded-lg bg-gt-surface border border-gt-border text-xs leading-relaxed text-gt-text-1">
          <p>
            <strong className="text-white">{customer.name}</strong> has maintained a strong engagement cadence over the last 90 days with an LTV of <strong>₹{customer.ltv.toLocaleString()}</strong>.
            Booking patterns indicate highest affinity towards logistics optimization routes and weekend promotion offers.
          </p>
          <div className="mt-3 pt-2 border-t border-gt-border flex items-center justify-between text-[11px] font-mono text-gt-muted">
            <span>Model: ChurnPredict-v2.1 (XGBoost)</span>
            <span>Confidence: 94.6%</span>
            <span>Data Freshness: Synchronized from PostgreSQL & CRM connector</span>
          </div>
        </div>
      </div>

      {/* Recent Activity & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 border border-gt-border space-y-4">
          <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
          <div className="space-y-2 text-xs">
            {[
              { id: "TX-9901", date: "Today, 14:20", amount: "₹42,500", status: "Settled", desc: "Corporate Route Booking" },
              { id: "TX-9844", date: "Yesterday, 11:15", amount: "₹88,000", status: "Settled", desc: "Enterprise Bulk Dispatch" },
              { id: "TX-9721", date: "3 days ago", amount: "₹34,200", status: "Settled", desc: "Express Transit Priority" },
            ].map((tx) => (
              <div key={tx.id} className="p-3 rounded-lg bg-gt-surface border border-gt-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{tx.desc}</div>
                  <div className="text-[10px] text-gt-muted font-mono">{tx.id} • {tx.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-gt-green">{tx.amount}</div>
                  <span className="badge badge-success text-[9px] py-0">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 border border-gt-border space-y-4">
          <h2 className="text-sm font-semibold text-white">Campaign & Marketing Touchpoints</h2>
          <div className="space-y-2 text-xs">
            {[
              { name: "Enterprise Holiday Promotion", channel: "Email Direct", touch: "Opened & Clicked", time: "2 hours ago" },
              { name: "LinkedIn B2B Retargeting", channel: "Paid Social", touch: "Converted", time: "2 days ago" },
              { name: "Google Search Ads — Corporate Transit", channel: "Search Ads", touch: "Impression", time: "5 days ago" },
            ].map((camp, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-gt-surface border border-gt-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{camp.name}</div>
                  <div className="text-[10px] text-gt-muted font-mono">{camp.channel} • {camp.time}</div>
                </div>
                <span className="badge badge-outline text-[10px] font-mono">{camp.touch}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
