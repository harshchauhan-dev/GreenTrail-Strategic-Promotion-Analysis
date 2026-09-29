"use client";

import React, { useState } from "react";
import { useApp } from "@/components/providers/Providers";
import {
  Database,
  Filter,
  Play,
  Download,
  Sparkles,
  BarChart3,
  Layers,
  ArrowRight,
  Table as TableIcon,
} from "lucide-react";

export default function DataExplorerPage() {
  const { triggerAiPrompt } = useApp();
  const [selectedDataset, setSelectedDataset] = useState("bookings");
  const [metric, setMetric] = useState("amount");
  const [groupBy, setGroupBy] = useState("region");
  const [dateRange, setDateRange] = useState("30d");
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<any[]>([
    { region: "North India (Delhi NCR)", count: 482, totalRevenue: "₹14.20L", avgTicket: "₹2,946" },
    { region: "West India (Mumbai/Pune)", count: 394, totalRevenue: "₹11.84L", avgTicket: "₹3,005" },
    { region: "South India (Bengaluru)", count: 285, totalRevenue: "₹8.95L", avgTicket: "₹3,140" },
    { region: "East India (Kolkata)", count: 123, totalRevenue: "₹3.69L", avgTicket: "₹3,000" },
  ]);

  const handleRunQuery = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Database className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Dynamic Data Engine & SQL Aggregations
            </span>
            <span className="badge badge-success text-[10px] font-mono">RBAC CONTROLLED</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            Live Data Explorer & Aggregation Engine
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            Query normalized company tables safely with governed dimensions, granular filters, and instant exports.
          </p>
        </div>

        <button
          onClick={() => triggerAiPrompt("Generate safe backend SQL query to analyze top customer revenue concentration")}
          className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Green AI to Write Query</span>
        </button>
      </div>

      {/* Query Builder Workspace */}
      <div className="card p-5 border border-gt-border space-y-4">
        <h2 className="text-sm font-semibold text-white pb-3 border-b border-gt-border font-sans">
          Controlled Query Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
          <div>
            <label className="block text-gt-muted mb-1 font-mono text-[11px]">Authorized Dataset</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="select w-full"
            >
              <option value="bookings">Bookings (Normalized)</option>
              <option value="transactions">Transactions (Financials)</option>
              <option value="customers">Customers (CRM)</option>
              <option value="campaigns">Campaigns (Marketing)</option>
              <option value="events">Telemetry Events (Stream)</option>
            </select>
          </div>

          <div>
            <label className="block text-gt-muted mb-1 font-mono text-[11px]">Primary Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="select w-full"
            >
              <option value="amount">Revenue (Gross Sum)</option>
              <option value="count">Volume (Transaction Count)</option>
              <option value="avg">AOV (Average Order Value)</option>
              <option value="cvr">Conversion Rate (%)</option>
            </select>
          </div>

          <div>
            <label className="block text-gt-muted mb-1 font-mono text-[11px]">Group By Dimension</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="select w-full"
            >
              <option value="region">Region / Geography</option>
              <option value="channel">Acquisition Channel</option>
              <option value="tier">Customer Tier</option>
              <option value="month">Time (Month / Week)</option>
            </select>
          </div>

          <div>
            <label className="block text-gt-muted mb-1 font-mono text-[11px]">Date Window</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="select w-full"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">Year to Date (YTD)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] font-mono text-gt-muted">
            Executing against PostgreSQL normalized replica • Read-only connection pool
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunQuery}
              disabled={isRunning}
              className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? "Executing..." : "Run Query"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Query Results Table */}
      <div className="card overflow-hidden border border-gt-border">
        <div className="p-4 border-b border-gt-border flex items-center justify-between bg-gt-surface/50">
          <div className="flex items-center gap-2 text-xs font-mono text-gt-muted">
            <TableIcon className="w-4 h-4 text-gt-green" />
            <span>Aggregated Results ({queryResult.length} rows)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Exported results to CSV")}
              className="btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => alert("Exported results to JSON")}
              className="btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full text-left font-sans">
            <thead>
              <tr>
                <th className="font-mono text-[10px] text-gt-muted">Dimension (Region)</th>
                <th className="font-mono text-[10px] text-gt-muted">Order Count</th>
                <th className="font-mono text-[10px] text-gt-muted">Total Gross Revenue</th>
                <th className="font-mono text-[10px] text-gt-muted">Average Ticket (AOV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gt-border/40 text-xs">
              {queryResult.map((row, idx) => (
                <tr key={idx} className="hover:bg-gt-surface/60 transition-colors">
                  <td className="font-semibold text-white">{row.region}</td>
                  <td className="font-mono text-gt-text-2">{row.count} orders</td>
                  <td className="font-mono text-gt-green font-bold">{row.totalRevenue}</td>
                  <td className="font-mono text-white">{row.avgTicket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
