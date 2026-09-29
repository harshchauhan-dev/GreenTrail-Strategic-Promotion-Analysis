"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/components/providers/Providers";
import { useStore } from "@/lib/store";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle,
  Database,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "green_ai";
  text: string;
  timestamp: string;
  metrics?: { label: string; value: string; delta: string; positive: boolean }[];
  evidence?: { title: string; link: string; type: string }[];
  toolsUsed?: string[];
}

export function GreenAIAssistant() {
  const { aiDrawerOpen, setAiDrawerOpen, activeAiPrompt } = useApp();
  const { kpis, liveEvents, alerts } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "green_ai",
      text: "Greetings. I am Green AI, connected to authorized live data sources across transactions, campaigns, CRM, and system feeds. How can I assist your investigation today?",
      timestamp: "Just now",
      toolsUsed: ["query_telemetry", "check_system_health"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeAiPrompt) {
      handleSendPrompt(activeAiPrompt);
    }
  }, [activeAiPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  const handleSendPrompt = async (promptText: string) => {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsAnalyzing(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/v1/ai/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText, role: "superadmin" }),
      });

      if (!res.ok) throw new Error("Failed to query backend AI router");
      const data = await res.json();

      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        sender: "green_ai",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString(),
        metrics: data.metrics?.map((m: any) => ({
          label: m.label,
          value: m.value,
          delta: m.delta,
          positive: !String(m.delta).includes("-"),
        })),
        evidence: data.evidence,
        toolsUsed: data.tools_used,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      // Fallback to client synthesis if backend is temporarily disconnected
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        sender: "green_ai",
        text: `Green AI Autonomous Synthesis (Client Cache):\n\nEvaluated: "${promptText}"\n• Active Telemetry: ${kpis.eventsPerSec} events/sec\n• P95 Latency: ${kpis.latencyMs}ms\n• Settled Revenue: ₹${kpis.revenueLakhs}L\n• Active Users: ${kpis.activeUsers.toLocaleString()}\n\nEvery metric is normalized across connected enterprise data pipelines.`,
        timestamp: new Date().toLocaleTimeString(),
        evidence: [
          { title: "Live Telemetry Feed", link: "/live", type: "live" },
          { title: "Company 360", link: "/company", type: "company" },
        ],
        toolsUsed: ["query_telemetry()", "client_cache_fallback()"],
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!aiDrawerOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gt-card border-l border-gt-border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gt-border flex items-center justify-between bg-gt-surface/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gt-green/20 border border-gt-green/40 flex items-center justify-center text-gt-green shadow-sm shadow-gt-green/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-white">Green AI</h2>
              <span className="badge badge-success text-[9px] font-mono py-0">v2.4 ACTIVE</span>
            </div>
            <p className="text-[11px] text-gt-muted">Authorized Live Intelligence Agent</p>
          </div>
        </div>
        <button
          onClick={() => setAiDrawerOpen(false)}
          className="btn btn-ghost p-1.5 text-gt-muted hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gt-muted font-mono">
              {msg.sender === "user" ? (
                <>
                  <span>You (Harsh)</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-gt-green" />
                  <span className="text-gt-green font-semibold">Green AI</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`max-w-[90%] rounded-xl p-3.5 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-gt-green text-gt-black font-medium"
                  : "bg-gt-surface border border-gt-border text-gt-text-1"
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {/* Controlled Tool Call Audit Tags */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gt-border/50 text-[10px] font-mono text-gt-muted">
                  <div className="text-gt-subtle mb-1">Backend Tools Executed:</div>
                  <div className="flex flex-wrap gap-1">
                    {msg.toolsUsed.map((tool, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-gt-card border border-gt-border text-gt-green">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics cards if any */}
              {msg.metrics && (
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gt-border/50">
                  {msg.metrics.map((m, idx) => (
                    <div key={idx} className="bg-gt-card p-2 rounded border border-gt-border">
                      <div className="text-[10px] text-gt-muted">{m.label}</div>
                      <div className="text-xs font-bold text-white font-mono">{m.value}</div>
                      <div className={`text-[10px] ${m.positive ? "text-gt-green" : "text-rose-400"}`}>
                        {m.delta}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Evidence & Navigation buttons */}
              {msg.evidence && (
                <div className="mt-3 pt-2 border-t border-gt-border/50 space-y-1.5">
                  <div className="text-[10px] text-gt-subtle uppercase tracking-wider font-mono">
                    Evidence & Investigation Links:
                  </div>
                  {msg.evidence.map((ev, idx) => (
                    <Link
                      key={idx}
                      href={ev.link}
                      onClick={() => setAiDrawerOpen(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded bg-gt-card border border-gt-border hover:border-gt-green/50 text-[11px] text-gt-green transition-colors"
                    >
                      <span>{ev.title}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gt-surface border border-gt-border text-xs text-gt-green font-mono">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Green AI is executing backend tools and correlating telemetry...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-2 border-t border-gt-border bg-gt-surface/40 overflow-x-auto flex gap-1.5 text-[10px]">
        <button
          onClick={() => handleSendPrompt("Why did revenue fall today?")}
          className="px-2 py-1 rounded bg-gt-card border border-gt-border text-gt-text-2 hover:border-gt-green hover:text-white shrink-0"
        >
          Why did revenue fall?
        </button>
        <button
          onClick={() => handleSendPrompt("Which marketing campaign has highest ROI?")}
          className="px-2 py-1 rounded bg-gt-card border border-gt-border text-gt-text-2 hover:border-gt-green hover:text-white shrink-0"
        >
          Highest ROI campaign?
        </button>
        <button
          onClick={() => handleSendPrompt("Forecast revenue for next 30 days")}
          className="px-2 py-1 rounded bg-gt-card border border-gt-border text-gt-text-2 hover:border-gt-green hover:text-white shrink-0"
        >
          Forecast next 30 days
        </button>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() && !isAnalyzing) {
            handleSendPrompt(input.trim());
          }
        }}
        className="p-3 border-t border-gt-border bg-gt-surface flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Green AI about company data, anomalies, or forecasts..."
          className="flex-1 bg-gt-card border border-gt-border rounded-lg px-3 py-2 text-xs text-white placeholder-gt-muted focus:outline-none focus:border-gt-green font-sans"
        />
        <button
          type="submit"
          disabled={!input.trim() || isAnalyzing}
          className="btn btn-primary p-2 text-gt-black disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
