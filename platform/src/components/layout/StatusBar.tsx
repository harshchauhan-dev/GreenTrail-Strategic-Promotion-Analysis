"use client";

import { useStore, WSStatus } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<
  WSStatus,
  { label: string; color: string; dot: string }
> = {
  connected:    { label: "LIVE CONNECTED",       color: "var(--color-gt-green)",  dot: "connected" },
  connecting:   { label: "CONNECTING…",          color: "var(--color-gt-amber)",  dot: "amber" },
  reconnecting: { label: "RECONNECTING…",        color: "var(--color-gt-amber)",  dot: "amber" },
  disconnected: { label: "LIVE CONNECTION LOST", color: "var(--color-gt-red)",    dot: "red" },
  error:        { label: "CONNECTION ERROR",     color: "var(--color-gt-red)",    dot: "red" },
};

export function StatusBar() {
  const { wsStatus, lastUpdate, demoMode, kpis } = useStore();
  const cfg = STATUS_CONFIG[wsStatus] || STATUS_CONFIG.connecting;

  return (
    <div className="status-bar">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`live-dot ${cfg.dot}`} />
        <span style={{ color: cfg.color, fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px" }}>
          {cfg.label}
        </span>
      </div>

      {/* Demo mode indicator */}
      {demoMode && (
        <div className="demo-banner" style={{ padding: "2px 10px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px" }}>
            ⬡ DEMO DATA
          </span>
        </div>
      )}

      {/* Separator */}
      <div style={{ width: 1, height: 14, background: "var(--color-gt-border)", margin: "0 4px" }} />

      {/* Live metrics in status bar */}
      <StatusMetric label="Events/min" value={String(kpis.eventsPerSec * 60)} />
      <StatusMetric label="Active Users" value={kpis.activeUsers.toLocaleString()} />
      <StatusMetric label="Latency" value={`${kpis.latencyMs}ms`} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Last update */}
      {lastUpdate && (
        <span style={{ fontSize: "10px", color: "var(--color-gt-text-4)" }}>
          Updated {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
        </span>
      )}
    </div>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: "10px", color: "var(--color-gt-text-4)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {label}
      </span>
      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-gt-green)", fontFamily: "var(--font-mono)" }}>
        {value}
      </span>
    </div>
  );
}
