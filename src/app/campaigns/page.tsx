"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/components/providers/Providers";
import {
  Megaphone,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Target,
  DollarSign,
  BarChart3,
  Layers,
} from "lucide-react";

export default function CampaignsPage() {
  const { triggerAiPrompt } = useApp();

  const campaigns = [
    {
      name: "Instagram Corporate Retargeting",
      channel: "Instagram Ads",
      spend: "₹85,000",
      revenue: "₹4,42,000",
      roi: "5.2x",
      cvr: "4.8%",
      cac: "₹240",
      status: "Active",
    },
    {
      name: "Google Search Ads — Corporate Transit",
      channel: "Google Ads",
      spend: "₹1,40,000",
      revenue: "₹5,18,000",
      roi: "3.7x",
      cvr: "3.2%",
      cac: "₹490",
      status: "Active",
    },
    {
      name: "LinkedIn B2B Freight Logistics",
      channel: "LinkedIn Ads",
      spend: "₹95,000",
      revenue: "₹4,20,000",
      roi: "4.4x",
      cvr: "2.9%",
      cac: "₹620",
      status: "Active",
    },
    {
      name: "WhatsApp Automated Booking Pilot",
      channel: "Direct Messaging",
      spend: "₹22,000",
      revenue: "₹1,65,000",
      roi: "7.5x",
      cvr: "14.2%",
      cac: "₹110",
      status: "Scaling",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Megaphone className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Marketing Attribution & Channel Intelligence
            </span>
            <span className="badge badge-success text-[10px] font-mono">LIVE ADS FEED</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Campaign Performance & Channel ROI Matrix
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Cross-platform multi-touch attribution, ad spend optimization, customer acquisition cost, and revenue efficiency.
          </p>
        </div>

        <button
          onClick={() => triggerAiPrompt("Analyze campaign efficiency and suggest ad spend reallocation to maximize ROI")}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Optimize Spend with Green AI</span>
        </button>
      </div>

      {/* Aggregate KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Blended Portfolio ROI</div>
          <div className="kpi-value text-gt-green mt-1">4.6x</div>
          <div className="text-[10px] text-gt-muted font-mono mt-1">Across 4 active channels</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Ad Spend (MTD)</div>
          <div className="kpi-value text-white mt-1">₹3.42L</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">Budget pacing: On target (91%)</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Blended CAC</div>
          <div className="kpi-value text-white mt-1">₹395</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">-8.4% improvement QoQ</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Attributed Revenue</div>
          <div className="kpi-value text-white mt-1">₹15.45L</div>
          <div className="text-[10px] text-gt-green font-mono mt-1">+22% incremental lift</div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="card overflow-hidden border border-gt-border">
        <div className="overflow-x-auto">
          <table className="table w-full text-left font-sans">
            <thead>
              <tr>
                <th className="font-mono text-[10px] text-gt-muted">Campaign Name</th>
                <th className="font-mono text-[10px] text-gt-muted">Channel</th>
                <th className="font-mono text-[10px] text-gt-muted">Spend</th>
                <th className="font-mono text-[10px] text-gt-muted">Attributed Revenue</th>
                <th className="font-mono text-[10px] text-gt-muted">ROI Multiplier</th>
                <th className="font-mono text-[10px] text-gt-muted">Conversion Rate</th>
                <th className="font-mono text-[10px] text-gt-muted">CAC</th>
                <th className="font-mono text-[10px] text-gt-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gt-border/40 text-xs">
              {campaigns.map((camp, idx) => (
                <tr key={idx} className="hover:bg-gt-surface/60 transition-colors">
                  <td className="font-semibold text-white">{camp.name}</td>
                  <td className="font-mono text-gt-text-2">{camp.channel}</td>
                  <td className="font-mono text-white">{camp.spend}</td>
                  <td className="font-mono text-gt-green font-bold">{camp.revenue}</td>
                  <td className="font-mono text-gt-green font-bold text-sm">{camp.roi}</td>
                  <td className="font-mono text-gt-text-2">{camp.cvr}</td>
                  <td className="font-mono text-white">{camp.cac}</td>
                  <td>
                    <span
                      className={`badge text-[9px] font-mono ${
                        camp.status === "Active" ? "badge-success" : "badge-outline"
                      }`}
                    >
                      {camp.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Resource Links */}
      <div className="card p-5 border border-gt-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gt-border">
          <h2 className="text-sm font-semibold text-white">Campaign Intelligence Resources</h2>
          <Link href="/resources" className="text-xs text-gt-green hover:underline font-mono">
            Resource Directory →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="https://business.safety.google"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-white">Digital Advertising Benchmarks (Google)</div>
              <div className="text-[11px] text-gt-muted">Official APAC conversion & CPC trends</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gt-muted" />
          </a>

          <a
            href="https://www.meta.com/business"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-white">Meta Business Intelligence Hub</div>
              <div className="text-[11px] text-gt-muted">Direct attribution & audience measurement</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gt-muted" />
          </a>
        </div>
      </div>
    </div>
  );
}
