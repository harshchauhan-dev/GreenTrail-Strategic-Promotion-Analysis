"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useApp } from "@/components/providers/Providers";
import {
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Users,
  Building2,
  Megaphone,
  Lightbulb,
  Radio,
  Bell,
  Database,
  FileText,
  Sliders,
  Server,
  Zap,
} from "lucide-react";

interface ActionItem {
  id: string;
  category: "Navigation" | "Quick Action" | "Green AI Investigation" | "Customers";
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const { setCommandPaletteOpen, reconnectWebSocket } = useStore();
  const { triggerAiPrompt } = useApp();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const close = () => setCommandPaletteOpen(false);

  const items: ActionItem[] = [
    // Direct AI prompt queries
    {
      id: "ai-why-revenue",
      category: "Green AI Investigation",
      title: "Why did revenue fall or fluctuate recently?",
      subtitle: "Autonomous multi-factor anomaly investigation",
      icon: Sparkles,
      keywords: ["revenue", "drop", "why", "anomaly", "fall"],
      action: () => {
        close();
        triggerAiPrompt("Why did revenue change in the last 24 hours? Correlate bookings, campaigns, and traffic.");
      },
    },
    {
      id: "ai-campaign-roi",
      category: "Green AI Investigation",
      title: "Analyze campaign ROI & channel efficiency",
      subtitle: "Green AI synthesizes CAC, LTV, and conversion rate",
      icon: Sparkles,
      keywords: ["campaign", "performance", "roi", "ad", "channel"],
      action: () => {
        close();
        triggerAiPrompt("Evaluate our active marketing campaigns and show channel ROI breakdown.");
      },
    },
    {
      id: "ai-churn-risk",
      category: "Green AI Investigation",
      title: "Forecast high-risk customer churn segments",
      subtitle: "Predictive ML retention analysis",
      icon: Sparkles,
      keywords: ["customer", "churn", "retention", "risk"],
      action: () => {
        close();
        triggerAiPrompt("Identify top customer accounts at high churn risk and recommend retention strategies.");
      },
    },

    // Navigation items
    {
      id: "nav-live",
      category: "Navigation",
      title: "Live Operations & Telemetry",
      subtitle: "/live — Real-time event streams & incoming messages",
      icon: Radio,
      keywords: ["live", "stream", "events", "telemetry", "realtime"],
      action: () => {
        close();
        router.push("/live");
      },
    },
    {
      id: "nav-company",
      category: "Navigation",
      title: "Company 360° Intelligence",
      subtitle: "/company — Comprehensive corporate performance & unit economics",
      icon: Building2,
      keywords: ["company", "360", "corporate", "operations", "business"],
      action: () => {
        close();
        router.push("/company");
      },
    },
    {
      id: "nav-market",
      category: "Navigation",
      title: "Market Intelligence & Signals",
      subtitle: "/market — Macro indicators, competitor trends, and sector data",
      icon: TrendingUp,
      keywords: ["market", "competitor", "trends", "industry", "signals"],
      action: () => {
        close();
        router.push("/market");
      },
    },
    {
      id: "nav-customers",
      category: "Navigation",
      title: "Customer Intelligence & CRM",
      subtitle: "/customers — Accounts, LTV, retention probability, cohorts",
      icon: Users,
      keywords: ["customers", "crm", "accounts", "users", "profiles"],
      action: () => {
        close();
        router.push("/customers");
      },
    },
    {
      id: "nav-campaigns",
      category: "Navigation",
      title: "Campaign Performance Analytics",
      subtitle: "/campaigns — Ad spend, conversion funnels, attribution",
      icon: Megaphone,
      keywords: ["campaigns", "ads", "marketing", "promotion", "attribution"],
      action: () => {
        close();
        router.push("/campaigns");
      },
    },
    {
      id: "nav-optimizer",
      category: "Navigation",
      title: "AI Budget & Portfolio Optimizer",
      subtitle: "/optimizer — Markowitz portfolio allocation, Sharpe ratio, and ad spend rebalancing",
      icon: TrendingUp,
      keywords: ["optimizer", "budget", "allocation", "markowitz", "rebalance", "portfolio"],
      action: () => {
        close();
        router.push("/optimizer");
      },
    },
    {
      id: "nav-insights",
      category: "Navigation",
      title: "Autonomous AI Insights",
      subtitle: "/insights — Continuous event monitoring & detected shifts",
      icon: Lightbulb,
      keywords: ["insights", "ai", "anomalies", "signals", "alerts"],
      action: () => {
        close();
        router.push("/insights");
      },
    },
    {
      id: "nav-forecast",
      category: "Navigation",
      title: "Predictive Forecasting",
      subtitle: "/forecast — 30/60/90-day probabilistic revenue and demand models",
      icon: TrendingUp,
      keywords: ["forecast", "predict", "future", "trends", "model"],
      action: () => {
        close();
        router.push("/forecast");
      },
    },
    {
      id: "nav-data",
      category: "Navigation",
      title: "Data Explorer & SQL Engine",
      subtitle: "/data — Dynamic dataset aggregation, filters, and exports",
      icon: Database,
      keywords: ["data", "explorer", "sql", "query", "filter", "export"],
      action: () => {
        close();
        router.push("/data");
      },
    },
    {
      id: "nav-integrations",
      category: "Navigation",
      title: "Data Connectors & Pipelines",
      subtitle: "/integrations — REST, GraphQL, Webhooks, Postgres, MySQL",
      icon: Zap,
      keywords: ["integrations", "connectors", "api", "postgres", "mysql", "webhook"],
      action: () => {
        close();
        router.push("/integrations");
      },
    },
    {
      id: "nav-reports",
      category: "Navigation",
      title: "Executive Reports Dossier",
      subtitle: "/reports — AI-synthesized board briefs & PDF/CSV exports",
      icon: FileText,
      keywords: ["reports", "executive", "export", "pdf", "brief"],
      action: () => {
        close();
        router.push("/reports");
      },
    },
    {
      id: "nav-system",
      category: "Navigation",
      title: "System Observability & Health",
      subtitle: "/system — Redis, PostgreSQL, latency graphs, API status",
      icon: Server,
      keywords: ["system", "health", "observability", "logs", "metrics", "latency"],
      action: () => {
        close();
        router.push("/system");
      },
    },

    // Customer shortcuts
    {
      id: "cust-10392",
      category: "Customers",
      title: "Customer #10392 — Apex Global Holdings",
      subtitle: "Enterprise Tier • ₹4.82L LTV • Low Churn Risk",
      icon: Users,
      keywords: ["10392", "apex", "customer 10392"],
      action: () => {
        close();
        router.push("/customers/10392");
      },
    },
    {
      id: "cust-10393",
      category: "Customers",
      title: "Customer #10393 — Zenith Logistics India",
      subtitle: "Growth Tier • ₹2.40L LTV • Medium Churn Risk",
      icon: Users,
      keywords: ["10393", "zenith", "customer 10393"],
      action: () => {
        close();
        router.push("/customers/10393");
      },
    },

    // Quick Actions
    {
      id: "act-reconnect",
      category: "Quick Action",
      title: "Force Reconnect Live WebSocket Stream",
      subtitle: "Re-establishes socket connection and requests full state sync",
      icon: Radio,
      keywords: ["reconnect", "websocket", "sync", "refresh"],
      action: () => {
        close();
        reconnectWebSocket();
      },
    },
  ];

  const filteredItems = items.filter((item) => {
    if (!query) return true;
    const cleanQuery = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(cleanQuery) ||
      item.subtitle?.toLowerCase().includes(cleanQuery) ||
      item.keywords?.some((k) => k.toLowerCase().includes(cleanQuery))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-gt-card border border-gt-border-l rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-gt-border bg-gt-surface/50">
          <Search className="w-5 h-5 text-gt-green mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, query, customer ID, or ask Green AI..."
            className="w-full bg-transparent text-sm text-white placeholder-gt-muted focus:outline-none font-sans"
          />
          <kbd className="kbd text-[10px] shrink-0">ESC to exit</kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-gt-border/30">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center">
              <Sparkles className="w-8 h-8 text-gt-green mx-auto mb-2 opacity-50" />
              <p className="text-sm text-gt-text-2">No command matches "{query}"</p>
              <button
                onClick={() => {
                  close();
                  triggerAiPrompt(query);
                }}
                className="mt-3 btn btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Green AI: "{query}"
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? "bg-gt-green/10 border border-gt-green/30 text-white" : "text-gt-text-2 hover:bg-gt-surface"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-md ${
                        isSelected ? "bg-gt-green text-gt-black" : "bg-gt-surface text-gt-green"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gt-surface border border-gt-border text-gt-muted font-mono">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-gt-muted mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isSelected ? "text-gt-green translate-x-1" : "text-gt-muted opacity-0"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-gt-surface/80 border-t border-gt-border flex items-center justify-between text-[11px] text-gt-muted font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1.5 text-gt-green">
            <Sparkles className="w-3 h-3" />
            <span>Green AI Agent Engine Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
