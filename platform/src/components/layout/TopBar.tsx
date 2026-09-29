"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Search,
  Bell,
  Sparkles,
  Shield,
  Activity,
  User,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Zap,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";

export function TopBar() {
  const pathname = usePathname();
  const {
    connectionStatus,
    demoMode,
    setCommandPaletteOpen,
    sidebarOpen,
    setSidebarOpen,
    alerts,
    lastUpdate,
    kpis,
    reconnectWebSocket,
  } = useStore();
  const { toggleAiDrawer, triggerAiPrompt } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadAlerts = alerts.filter((a) => !a.acknowledged);

  const getSectionTitle = () => {
    if (pathname === "/") return "Live Intelligence Command";
    if (pathname.startsWith("/live")) return "Real-Time Telemetry & Activity Stream";
    if (pathname.startsWith("/company")) return "Company 360° Operations";
    if (pathname.startsWith("/market")) return "Market Intelligence & Competitor Signals";
    if (pathname.startsWith("/customers")) return "Customer 360 & Predictive Churn";
    if (pathname.startsWith("/campaigns")) return "Campaign Analytics & Channel ROI";
    if (pathname.startsWith("/optimizer")) return "AI Campaign & Capital Budget Optimizer";
    if (pathname.startsWith("/insights")) return "Autonomous AI Insights Engine";
    if (pathname.startsWith("/forecast")) return "Predictive Forecasting & Trend Models";
    if (pathname.startsWith("/alerts")) return "Live Alert Center & Threshold Rules";
    if (pathname.startsWith("/data")) return "Data Explorer & Query Engine";
    if (pathname.startsWith("/ai")) return "Green AI Studio & Function Calling";
    if (pathname.startsWith("/reports")) return "Executive Reports & Automated Dossiers";
    if (pathname.startsWith("/integrations")) return "Connector Hub & Pipeline Health";
    if (pathname.startsWith("/resources")) return "External Verified Resource Hub";
    if (pathname.startsWith("/system")) return "System Architecture & Observability";
    if (pathname.startsWith("/settings")) return "Platform Settings & RBAC Permissions";
    return "Intelligence Platform";
  };

  return (
    <header className="top-bar">
      <div className="flex items-center gap-3">
        {/* Clickable option to Open/Close Sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-gt-muted hover:text-gt-green hover:bg-gt-surface border border-gt-border hover:border-gt-green/40 transition-all flex items-center justify-center group focus:outline-none focus:ring-1 focus:ring-gt-green/50"
          title={sidebarOpen ? "Close sidebar (Ctrl+B)" : "Open sidebar (Ctrl+B)"}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 transition-transform group-hover:scale-110" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-gt-green transition-transform group-hover:scale-110" />
          )}
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-wide text-white font-sans">
              {getSectionTitle()}
            </h1>
            <span className="badge badge-outline text-[10px] uppercase font-mono tracking-wider">
              {pathname}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gt-muted mt-0.5 font-mono">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-gt-green animate-pulse"
                    : connectionStatus === "reconnecting"
                    ? "bg-amber-400 animate-ping"
                    : "bg-rose-500"
                }`}
              />
              {connectionStatus === "connected"
                ? "FEED LIVE"
                : connectionStatus === "reconnecting"
                ? "RECONNECTING"
                : "OFFLINE"}
            </span>
            <span>•</span>
            <span>Latency: {kpis.latencyMs}ms</span>
            <span>•</span>
            <span>Events: {kpis.eventsPerSec}/s</span>
            <span>•</span>
            <span className="text-gt-subtle">
              Freshness: {lastUpdate ? `${Math.max(1, Math.round((Date.now() - new Date(lastUpdate).getTime()) / 1000))}s ago` : "Connecting..."}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Search / Command Palette trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="search-bar hidden md:flex items-center justify-between w-64 hover:border-gt-green/40 transition-colors"
          title="Search or execute commands (Ctrl+K)"
        >
          <div className="flex items-center gap-2 text-gt-muted text-xs">
            <Search className="w-3.5 h-3.5 text-gt-green" />
            <span>Search or command...</span>
          </div>
          <kbd className="kbd text-[10px]">Ctrl K</kbd>
        </button>

        {/* Global Green AI Trigger */}
        <button
          onClick={toggleAiDrawer}
          className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm shadow-gt-green/20"
          title="Open Green AI Intelligence"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Green AI</span>
        </button>

        {/* Live Presence indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-gt-surface border border-gt-border text-[11px] font-mono text-gt-muted">
          <div className="flex -space-x-1.5 overflow-hidden">
            <span className="inline-block w-4 h-4 rounded-full ring-1 ring-gt-bg bg-emerald-700 text-[9px] text-white font-bold text-center leading-4">
              H
            </span>
            <span className="inline-block w-4 h-4 rounded-full ring-1 ring-gt-bg bg-cyan-700 text-[9px] text-white font-bold text-center leading-4">
              A
            </span>
          </div>
          <span>2 online</span>
        </div>

        {/* Reconnect button if offline */}
        {connectionStatus !== "connected" && (
          <button
            onClick={reconnectWebSocket}
            className="btn btn-secondary text-xs py-1.5 px-2.5 text-amber-400 hover:text-amber-300"
            title="Reconnect Live Feed"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          </button>
        )}

        {/* Alerts / Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="btn btn-ghost p-2 relative"
            title="Alerts and Notifications"
          >
            <Bell className="w-4 h-4 text-gt-text-2" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg bg-gt-card border border-gt-border-l shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-gt-border">
                <span className="text-xs font-semibold text-white">Live Alerts ({alerts.length})</span>
                <Link
                  href="/alerts"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] text-gt-green hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gt-border/50 max-h-64 overflow-y-auto mt-2">
                {alerts.length === 0 ? (
                  <p className="text-xs text-gt-muted py-4 text-center">No active alerts</p>
                ) : (
                  alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${
                            alert.severity === "critical"
                              ? "text-rose-400"
                              : alert.severity === "warning"
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {alert.title}
                        </span>
                        <span className="text-[10px] text-gt-muted font-mono">{alert.timestamp}</span>
                      </div>
                      <p className="text-gt-text-2 mt-0.5 line-clamp-1">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded hover:bg-gt-surface transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gt-green/20 border border-gt-green/40 flex items-center justify-center text-xs font-semibold text-gt-green">
              H
            </div>
            <div className="hidden xl:block text-left text-xs">
              <div className="font-semibold text-white leading-none">Harsh</div>
              <div className="text-[10px] text-gt-muted leading-tight mt-0.5">Enterprise Admin</div>
            </div>
            <ChevronDown className="w-3 h-3 text-gt-muted" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg bg-gt-card border border-gt-border-l shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-gt-border">
                <p className="text-xs font-semibold text-white">Harsh (Admin)</p>
                <p className="text-[10px] text-gt-muted font-mono">harsh@greentrail.internal</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-gt-green">
                  <Shield className="w-3 h-3" />
                  <span>Full Role: Superadmin</span>
                </div>
              </div>
              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="block px-3 py-1.5 text-xs text-gt-text-2 hover:text-white hover:bg-gt-surface rounded"
                >
                  Platform Settings
                </Link>
                <Link
                  href="/system"
                  onClick={() => setProfileOpen(false)}
                  className="block px-3 py-1.5 text-xs text-gt-text-2 hover:text-white hover:bg-gt-surface rounded"
                >
                  System & Logs
                </Link>
                <Link
                  href="/integrations"
                  onClick={() => setProfileOpen(false)}
                  className="block px-3 py-1.5 text-xs text-gt-text-2 hover:text-white hover:bg-gt-surface rounded"
                >
                  Manage Connectors
                </Link>
              </div>
              <div className="pt-1 border-t border-gt-border">
                <button
                  onClick={() => triggerAiPrompt("Audit recent administrative actions and logins")}
                  className="w-full text-left px-3 py-1.5 text-xs text-gt-green hover:bg-gt-surface rounded flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  Audit with AI
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
