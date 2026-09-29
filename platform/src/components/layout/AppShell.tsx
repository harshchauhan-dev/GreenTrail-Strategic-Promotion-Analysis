"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { GreenAIAssistant } from "@/components/ai/GreenAIAssistant";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    connectWebSocket,
    commandPaletteOpen,
    setCommandPaletteOpen,
    sidebarOpen,
    setSidebarOpen,
  } = useStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    connectWebSocket();
  }, [connectWebSocket]);

  // Global keyboard shortcuts:
  // - Ctrl+K / Cmd+K: Command Palette
  // - Ctrl+B / Cmd+B: Toggle Sidebar
  // - Escape: Close Command Palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandPaletteOpen, setCommandPaletteOpen, sidebarOpen, setSidebarOpen]);

  return (
    <div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <StatusBar />
      <Sidebar />
      <TopBar />
      <main className="main-content">
        {children}
      </main>
      {commandPaletteOpen && <CommandPalette />}
      <GreenAIAssistant />
    </div>
  );
}
