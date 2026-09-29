"use client";

import React from "react";
import {
  ExternalLink,
  BookOpen,
  FileText,
  Globe,
  Database,
  Layers,
  ShieldCheck,
  Compass,
} from "lucide-react";

export default function ResourcesPage() {
  const resourceCategories = [
    {
      category: "Verified Macroeconomic & Industry Data",
      description: "Official government portals and authenticated data repositories",
      links: [
        {
          name: "National Open Data Portal (India)",
          desc: "Official public datasets from Central & State ministries",
          url: "https://data.gov.in",
          tag: "Government Portal",
        },
        {
          name: "Reserve Bank of India Database (DBIE)",
          desc: "Macroeconomic indicators, currency exchange, and liquidity rates",
          url: "https://dbie.rbi.org.in",
          tag: "Central Bank",
        },
        {
          name: "Ministry of Road Transport & Highways (MoRTH)",
          desc: "National highway logistics corridors and vehicle freight data",
          url: "https://morth.nic.in",
          tag: "Logistics Telemetry",
        },
      ],
    },
    {
      category: "Sector Research & Market Intelligence",
      description: "Validated economic intelligence and sector publications",
      links: [
        {
          name: "India Brand Equity Foundation (IBEF)",
          desc: "Industry trends, sector performance reports, and market size research",
          url: "https://www.ibef.org",
          tag: "Market Research",
        },
        {
          name: "NITI Aayog National Data & Analytics Platform",
          desc: "Harmonized sectoral indicators across Indian commerce and infrastructure",
          url: "https://ndap.niti.gov.in",
          tag: "Public Policy Data",
        },
      ],
    },
    {
      category: "Platform Architecture & Standards Documentation",
      description: "Standards and specifications underpinning the GreenTrail data layer",
      links: [
        {
          name: "OpenAPI Specification v3.1",
          desc: "Machine-readable interface definition standard for REST connectors",
          url: "https://spec.openapis.org/oas/latest.html",
          tag: "API Standard",
        },
        {
          name: "PostgreSQL Official Documentation",
          desc: "Relational storage, indexing, and connection pooling reference",
          url: "https://www.postgresql.org/docs/",
          tag: "Database Engine",
        },
        {
          name: "FastAPI Production Framework",
          desc: "High-performance async Python backend specifications",
          url: "https://fastapi.tiangolo.com",
          tag: "Backend Framework",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-5 border border-gt-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-gt-green/20 text-gt-green">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono text-gt-green uppercase tracking-wider font-bold">
              Verified External Intelligence Hub
            </span>
            <span className="badge badge-success text-[10px] font-mono">100% VERIFIED URLS</span>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">
            External Resources & Knowledge Directory
          </h1>
          <p className="text-xs text-gt-muted mt-0.5">
            GreenTrail is connected to the wider economic ecosystem. Explore verified portals, official datasets, and industry documentation.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {resourceCategories.map((cat, idx) => (
          <div key={idx} className="card p-5 border border-gt-border space-y-4">
            <div className="pb-3 border-b border-gt-border">
              <h2 className="text-sm font-semibold text-white">{cat.category}</h2>
              <p className="text-xs text-gt-muted mt-0.5">{cat.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.links.map((link, lIdx) => (
                <a
                  key={lIdx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-lg bg-gt-surface border border-gt-border hover:border-gt-green/50 hover:bg-gt-card transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="badge badge-outline text-[9px] font-mono">{link.tag}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gt-muted group-hover:text-gt-green transition-colors" />
                    </div>
                    <div className="font-semibold text-white text-xs mt-2 group-hover:text-gt-green transition-colors">
                      {link.name}
                    </div>
                    <p className="text-[11px] text-gt-muted mt-1 leading-normal">{link.desc}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gt-border/40 text-[10px] font-mono text-gt-subtle truncate">
                    {link.url}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
