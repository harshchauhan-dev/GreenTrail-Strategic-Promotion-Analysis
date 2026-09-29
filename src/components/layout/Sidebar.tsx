"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard, Radio, TrendingUp, Users, Building2,
  Megaphone, Lightbulb, BarChart3, Bell, Database, Bot,
  FileText, Plug, Settings, ChevronDown, Search, Activity, Sliders,
  PanelLeftClose,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/",              label: "Overview",       icon: LayoutDashboard, group: "main" },
  { href: "/live",          label: "Live Feed",      icon: Radio,           group: "main", live: true },
  { href: "/company",       label: "Company 360",    icon: Building2,       group: "intelligence" },
  { href: "/customers",     label: "Customers",      icon: Users,           group: "intelligence" },
  { href: "/campaigns",     label: "Campaigns",      icon: Megaphone,       group: "intelligence" },
  { href: "/optimizer",     label: "Budget Optimizer", icon: Sliders,        group: "intelligence" },
  { href: "/market",        label: "Market",         icon: TrendingUp,      group: "intelligence" },
  { href: "/insights",      label: "AI Insights",    icon: Lightbulb,       group: "ai", badge: "newInsightCount" },
  { href: "/ai",            label: "GREEN AI",       icon: Bot,             group: "ai" },
  { href: "/forecast",      label: "Forecast",       icon: BarChart3,       group: "ai" },
  { href: "/alerts",        label: "Alert Center",   icon: Bell,            group: "ops", badge: "unreadAlerts" },
  { href: "/data",          label: "Data Explorer",  icon: Database,        group: "ops" },
  { href: "/reports",       label: "Reports",        icon: FileText,        group: "ops" },
  { href: "/integrations",  label: "Integrations",   icon: Plug,            group: "system" },
  { href: "/system",        label: "System Health",  icon: Activity,        group: "system" },
  { href: "/settings",      label: "Settings",       icon: Settings,        group: "system" },
];

const GROUPS: Record<string, string> = {
  main: "Platform",
  intelligence: "Intelligence",
  ai: "AI Engine",
  ops: "Operations",
  system: "System",
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, newInsightCount, unreadAlerts, kpi } = useStore();

  const getBadge = (badge?: string) => {
    if (!badge) return null;
    const val = badge === "newInsightCount" ? newInsightCount : badge === "unreadAlerts" ? unreadAlerts : 0;
    return val > 0 ? val : null;
  };

  const grouped = NAV_ITEMS.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof NAV_ITEMS>);

  return (
    <aside
      className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}
    >
      {/* Logo & Close Button */}
      <div style={{
        padding: "16px 14px 14px 16px",
        borderBottom: "1px solid var(--color-gt-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 0 20px rgba(74,222,128,0.35)",
            flexShrink: 0,
          }}>🌿</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: "-0.3px", lineHeight: 1.2 }}>
              GreenTrail
            </div>
            <div style={{ fontSize: 10, color: "var(--color-gt-text-3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Intelligence Platform
            </div>
          </div>
        </div>

        {/* Clickable option to close sidebar */}
        <button
          onClick={() => setSidebarOpen(false)}
          title="Close sidebar (Ctrl+B)"
          aria-label="Close sidebar"
          style={{
            background: "transparent",
            border: "1px solid var(--color-gt-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-gt-text-3)",
            padding: "5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-gt-green)";
            e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)";
            e.currentTarget.style.background = "var(--color-gt-card)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-gt-text-3)";
            e.currentTarget.style.borderColor = "var(--color-gt-border)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Search shortcut */}
      <div style={{ padding: "10px 12px" }}>
        <button
          onClick={() => useStore.getState().setCommandPaletteOpen(true)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            background: "var(--color-gt-base)", border: "1px solid var(--color-gt-border)",
            borderRadius: "var(--radius-sm)", padding: "7px 10px",
            color: "var(--color-gt-text-3)", fontSize: 12, cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(74,222,128,0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-gt-border)")}
        >
          <Search size={13} />
          <span>Search or ask AI…</span>
          <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--font-mono)", opacity: 0.5 }}>⌘K</span>
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "var(--color-gt-text-4)",
              textTransform: "uppercase", letterSpacing: "0.7px",
              padding: "4px 8px 6px",
            }}>
              {GROUPS[group]}
            </div>
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const badge = getBadge(item.badge);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "8px 10px", borderRadius: "var(--radius-sm)",
                    marginBottom: 1,
                    color: active ? "var(--color-gt-green)" : "var(--color-gt-text-2)",
                    background: active ? "rgba(74,222,128,0.09)" : "transparent",
                    border: `1px solid ${active ? "rgba(74,222,128,0.18)" : "transparent"}`,
                    fontSize: 13.5, fontWeight: active ? 600 : 400,
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(74,222,128,0.04)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.live && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: "var(--color-gt-red)", letterSpacing: "0.5px", animation: "pulse-text 1.5s infinite" }}>
                      ● LIVE
                    </span>
                  )}
                  {badge !== null && (
                    <span style={{
                      background: item.badge === "unreadAlerts" ? "rgba(248,113,113,0.15)" : "rgba(192,132,252,0.15)",
                      color: item.badge === "unreadAlerts" ? "var(--color-gt-red)" : "var(--color-gt-purple)",
                      fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
                    }}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar footer — live mini stats */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--color-gt-border)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
          <SidebarMini label="Active Users" value={kpi?.active_users?.toLocaleString() ?? "—"} />
          <SidebarMini label="Live Bookings" value={String(kpi?.live_bookings ?? "—")} />
          <SidebarMini label="Rev. Today" value={kpi?.revenue_today ? "₹" + (kpi.revenue_today / 1000).toFixed(0) + "K" : "—"} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--color-gt-text-3)" }}>
          <div className="live-dot" style={{ width: 6, height: 6 }} />
          Q2 2026 — Live
        </div>
      </div>
    </aside>
  );
}

function SidebarMini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "var(--color-gt-text-3)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--color-gt-green)" }}>
        {value}
      </span>
    </div>
  );
}
