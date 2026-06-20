"use client";

import React from "react";
import {
  RefreshCw,
  Database,
  Clock,
  DollarSign,
  Cpu,
  Play,
  Settings,
  Compass
} from "lucide-react";

interface AppNode {
  id: string;
  name: string;
  created: string;
}

interface AnalyticsData {
  total_traces: number;
  avg_latency_ms: number;
  total_cost_usd: number;
  total_tokens: number;
}

interface DashboardOverviewProps {
  selectedApp: AppNode;
  analyticsData: AnalyticsData | null;
  loadingAnalytics: boolean;
  fetchAnalyticsOverview: (id: string) => void;
  triggerSimulation: () => void;
  simulating: boolean;
  gatewayUrl: string;
  maxConcurrency: number;
  ewmaAlpha: number;
  driftBatchSize: number;
  piiScrubbing: boolean;
  setActiveTab: (tab: string) => void;
}

export default function DashboardOverview({
  selectedApp,
  analyticsData,
  loadingAnalytics,
  fetchAnalyticsOverview,
  triggerSimulation,
  simulating,
  gatewayUrl,
  maxConcurrency,
  ewmaAlpha,
  driftBatchSize,
  piiScrubbing,
  setActiveTab,
}: DashboardOverviewProps) {
  console.log(analyticsData)
  return (
    <>
      {/* PAGE MAIN HEADLINE & INTRO */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-[#171719] leading-tight">
            Application Observability Overview
          </h2>
          <p className="text-sm text-[#64748B] max-w-2xl">
            Real-time Ingestion performance statistics, average request latencies, and aggregated token cost indicators for **{selectedApp.name}**.
          </p>
        </div>

        <button
          onClick={() => fetchAnalyticsOverview(selectedApp.id)}
          disabled={loadingAnalytics}
          className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 rounded-xl bg-white border border-neutral-200/70 hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loadingAnalytics ? "animate-spin" : ""}`} />
          <span>Sync Ingest Metrics</span>
        </button>
      </div>

      {/* STAT CARDS GRID */}
      {loadingAnalytics && !analyticsData ? (
        <div className="bg-white border border-neutral-200/50 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#64748B]" />
          <span className="text-xs text-[#64748B] font-mono">Aggregating telemetry records...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Traces */}
          <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden group hover:border-neutral-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">Total Traces Ingested</span>
              <div className="p-2 rounded-xl bg-neutral-100 text-[#171719] group-hover:bg-[#171719] group-hover:text-white transition-colors duration-300">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-3xl font-black text-[#171719] tracking-tight">
                {analyticsData?.total_traces.toLocaleString() ?? "0"}
              </h4>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live timeseries feed active
              </p>
            </div>
          </div>

          {/* Card 2: Average Latency */}
          <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden group hover:border-neutral-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">Average Latency</span>
              <div className="p-2 rounded-xl bg-neutral-100 text-[#171719] group-hover:bg-[#171719] group-hover:text-white transition-colors duration-300">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-3xl font-black text-[#171719] tracking-tight">
                {analyticsData?.avg_latency_ms ?? "0"}<span className="text-sm font-normal text-[#64748B] ml-1">ms</span>
              </h4>
              <p className="text-[10px] text-[#64748B] mt-1">
                Across last 24h continuous view
              </p>
            </div>
          </div>

          {/* Card 3: Total Cost */}
          <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden group hover:border-neutral-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">Accumulated Cost</span>
              <div className="p-2 rounded-xl bg-neutral-100 text-[#171719] group-hover:bg-[#171719] group-hover:text-white transition-colors duration-300">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-3xl font-black text-[#171719] tracking-tight">
                ${analyticsData?.total_cost_usd !== undefined ? analyticsData.total_cost_usd.toFixed(6) : "0.000000"}
              </h4>
              <p className="text-[10px] text-[#64748B] mt-1">
                Weighted Groq LPU + local Ollama usage
              </p>
            </div>
          </div>

          {/* Card 4: Total Tokens */}
          <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden group hover:border-neutral-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">Token Volatility</span>
              <div className="p-2 rounded-xl bg-neutral-100 text-[#171719] group-hover:bg-[#171719] group-hover:text-white transition-colors duration-300">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-3xl font-black text-[#171719] tracking-tight">
                {analyticsData?.total_tokens.toLocaleString() ?? "0"}<span className="text-xs font-normal text-[#64748B] ml-1">tokens</span>
              </h4>
              <p className="text-[10px] text-[#64748B] mt-1">
                Ingested raw prompt & response context
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CORE METRICS AND FLOW GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Graph Simulation panel */}
        <div className="lg:col-span-8 bg-white border border-neutral-200/50 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#171719] uppercase tracking-tight font-mono">
              Real-Time Telemetry Stream Activity
            </h3>
            <p className="text-xs text-[#64748B]">
              Ingestion frequency profiles mapped to 1-hour TimescaleDB aggregates.
            </p>
          </div>

          {/* Simulated Visual Graph using CSS bars */}
          <div className="h-44 flex items-end gap-2 px-2 border-b border-neutral-200/50 pb-2 bg-[#FBFBFA] rounded-xl relative overflow-hidden pt-6">
            <div className="absolute top-2 left-3 font-mono text-[9px] text-[#64748B] flex gap-3">
              <span>Live stream volatility</span>
              <span>•</span>
              <span>y-max: 100 req/s</span>
            </div>
            {/* Render series of bar vectors */}
            {Array.from({ length: 24 }).map((_, idx) => {
              const heightPercent = Math.max(
                10,
                Math.round(45 + Math.sin(idx / 3) * 30 + (Math.random() - 0.5) * 15)
              );
              return (
                <div
                  key={idx}
                  className="flex-1 rounded-t-sm transition-all duration-500 relative group"
                  style={{ height: `${heightPercent}%` }}
                >
                  <div className="w-full h-full bg-[#171719]/10 group-hover:bg-[#171719]/30 rounded-t-sm transition-all duration-300" />
                  {idx === 23 && (
                    <div className="w-full h-full absolute inset-0 bg-[#C5A059] rounded-t-sm animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs border-t border-neutral-100 pt-4">
            <span className="text-[#64748B] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live update pipeline refreshed {new Date().toLocaleTimeString()}
            </span>
            <button
              onClick={triggerSimulation}
              disabled={simulating}
              className="flex items-center gap-1.5 font-semibold py-2 px-4 rounded-xl bg-[#171719] hover:bg-neutral-800 text-white text-xs border-transparent transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              <span>{simulating ? "Sending Trace..." : "Trigger Simulation Trace"}</span>
            </button>
          </div>
        </div>

        {/* Right: Active Configuration summary */}
        <div className="lg:col-span-4 bg-white border border-neutral-200/50 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#171719] uppercase tracking-tight font-mono">
                Platform Ingest Settings
              </h3>
              <p className="text-xs text-[#64748B]">Active tuning parameters applied to this node.</p>
            </div>

            <div className="space-y-3 font-mono text-[11px] text-[#64748B]">
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span>Gateway Target</span>
                <span className="font-bold text-[#171719]">{gatewayUrl}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span>Max Workers</span>
                <span className="font-bold text-[#171719]">{maxConcurrency} concurrency</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span>EWMA Alpha (α)</span>
                <span className="font-bold text-[#171719]">{ewmaAlpha.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2">
                <span>Drift Window Size</span>
                <span className="font-bold text-[#171719]">{driftBatchSize} traces</span>
              </div>
              <div className="flex justify-between">
                <span>PII Masking Filter</span>
                <span className="font-bold text-emerald-700">{piiScrubbing ? "Active" : "Disabled"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("sdk-settings")}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-4 rounded-xl border border-neutral-200/70 bg-white hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98]"
          >
            <Settings className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Adjust Ingest Settings</span>
          </button>
        </div>
      </div>
    </>
  );
}
