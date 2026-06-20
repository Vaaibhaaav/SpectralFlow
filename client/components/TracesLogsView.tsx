"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  RefreshCw,
  Database,
  Terminal,
  Clock,
  DollarSign,
  Cpu,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  MessageSquare,
  List,
  Layers,
  X,
  Copy,
  Check,
  Calendar,
  ArrowRight,
  Sparkles,
  Radio
} from "lucide-react";

interface AppNode {
  id: string;
  name: string;
  created: string;
}

interface TraceEvent {
  id: string;
  app_id: string;
  session_id: string;
  timestamp: string;
  model: string;
  prompt: string;
  response: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  cost_usd: number;
  metadata: any;
}

interface TracesLogsViewProps {
  selectedApp: AppNode;
  traces: TraceEvent[];
  loading: boolean;
  onRefresh: () => void;
}

export default function TracesLogsView({
  selectedApp,
  traces,
  loading,
  onRefresh,
}: TracesLogsViewProps) {
  // Navigation & View State
  const [viewMode, setViewMode] = useState<"list" | "sessions">("list");
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLiveTail, setIsLiveTail] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");
  const [minLatency, setMinLatency] = useState("all");

  // Auto-polling effect for Live Tail
  useEffect(() => {
    if (!isLiveTail) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveTail, onRefresh]);

  // Extract unique models for dropdown filtering
  const uniqueModels = useMemo(() => {
    const models = new Set<string>();
    traces.forEach((t) => {
      if (t.model) models.add(t.model);
    });
    return Array.from(models);
  }, [traces]);

  // Filter traces based on criteria
  const filteredTraces = useMemo(() => {
    return traces.filter((t) => {
      // 1. Text Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        t.id.toLowerCase().includes(searchLower) ||
        (t.prompt && t.prompt.toLowerCase().includes(searchLower)) ||
        (t.response && t.response.toLowerCase().includes(searchLower)) ||
        (t.session_id && t.session_id.toLowerCase().includes(searchLower));

      // 2. Model Filter
      const matchesModel = selectedModel === "all" || t.model === selectedModel;

      // 3. Latency Filter
      let matchesLatency = true;
      if (minLatency !== "all") {
        const minVal = parseInt(minLatency, 10);
        matchesLatency = t.latency_ms >= minVal;
      }

      return matchesSearch && matchesModel && matchesLatency;
    });
  }, [traces, searchQuery, selectedModel, minLatency]);

  // Session thread grouping aggregation
  const sessionThreads = useMemo(() => {
    const groups: Record<string, TraceEvent[]> = {};
    
    // We group from the filtered traces list to keep user search/filters respected
    filteredTraces.forEach((t) => {
      const sId = t.session_id || "global_session";
      if (!groups[sId]) groups[sId] = [];
      groups[sId].push(t);
    });

    // Sort messages in each session by time ascending
    Object.keys(groups).forEach((sId) => {
      groups[sId].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });

    // Map into array and sort by most recent trace time descending
    return Object.entries(groups)
      .map(([id, list]) => ({
        id,
        traces: list,
        lastActive: list[list.length - 1].timestamp,
        avgLatency: Math.round(list.reduce((acc, t) => acc + t.latency_ms, 0) / list.length),
        totalCost: list.reduce((acc, t) => acc + t.cost_usd, 0),
        model: list[list.length - 1].model,
      }))
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
  }, [filteredTraces]);

  const handleCopy = (text: string, labelId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(labelId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Locate the trace currently selected for the sliding detail drawer
  const activeTraceDetails = useMemo(() => {
    return traces.find((t) => t.id === selectedTraceId) || null;
  }, [traces, selectedTraceId]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-[#171719] leading-tight">
            Telemetry Traces & Audit Logs
          </h2>
          <p className="text-sm text-[#64748B] max-w-2xl">
            Audit raw execution prompts, generated response blocks, and token latency telemetry metrics for **{selectedApp.name}**.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Tail Switch */}
          <button
            onClick={() => setIsLiveTail(!isLiveTail)}
            className={`flex items-center gap-2 text-xs font-semibold py-2 px-3.5 rounded-xl border transition-all duration-300 active:scale-[0.98] shadow-sm ${
              isLiveTail
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-white border-neutral-200/70 hover:bg-[#F5F5F0] text-[#64748B]"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveTail ? "animate-pulse text-emerald-600" : "text-neutral-450"}`} />
            <span>{isLiveTail ? "Live Tail Active" : "Enable Live Tail"}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 rounded-xl bg-white border border-neutral-200/70 hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SEARCH, FILTER & VIEW TOGGLE PANEL */}
      <div className="bg-white border border-neutral-200/50 rounded-2xl p-4.5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search prompts, responses, sessions, or trace ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 border border-neutral-200/70 rounded-xl text-xs focus:outline-none focus:border-neutral-400 bg-[#FBFBFA] transition-colors text-[#171719]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Toggles */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
            {/* Model Filter */}
            <div className="flex items-center gap-1.5 bg-[#FBFBFA] border border-neutral-200/70 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3 h-3 text-[#64748B]" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent focus:outline-none text-[#171719] font-medium pr-1"
              >
                <option value="all">All Models</option>
                {uniqueModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Latency Filter */}
            <div className="flex items-center gap-1.5 bg-[#FBFBFA] border border-neutral-200/70 rounded-xl px-2.5 py-1.5 text-xs">
              <Clock className="w-3 h-3 text-[#64748B]" />
              <select
                value={minLatency}
                onChange={(e) => setMinLatency(e.target.value)}
                className="bg-transparent focus:outline-none text-[#171719] font-medium pr-1"
              >
                <option value="all">Any Latency</option>
                <option value="100">&gt; 100ms</option>
                <option value="200">&gt; 200ms</option>
                <option value="500">&gt; 500ms</option>
                <option value="1000">&gt; 1s</option>
              </select>
            </div>

            {/* View Switcher Toggle */}
            <div className="bg-[#F5F5F0] border border-neutral-200/70 rounded-xl p-0.75 flex">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-white text-[#171719] shadow-xs"
                    : "text-[#64748B] hover:text-[#171719]"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Timeline Feed</span>
              </button>
              <button
                onClick={() => setViewMode("sessions")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  viewMode === "sessions"
                    ? "bg-white text-[#171719] shadow-xs"
                    : "text-[#64748B] hover:text-[#171719]"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Session Threads</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* CONTENT LOG FEED PANEL */}
      <section className="bg-white border border-neutral-200/50 rounded-2xl p-6 shadow-sm">
        {loading && filteredTraces.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#64748B]" />
            <span className="text-xs text-[#64748B] font-mono">Loading trace history...</span>
          </div>
        ) : filteredTraces.length === 0 ? (
          <div className="p-16 text-center space-y-3 bg-[#FBFBFA] rounded-xl border border-dashed border-neutral-200/85">
            <Database className="w-8 h-8 text-neutral-450 mx-auto" />
            <span className="text-sm font-bold text-[#171719]">No Matching Traces Found</span>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              No trace matches your filters. Adjust your search keywords, models, or latency range thresholds to audit metrics.
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* TIMELINE LIST VIEW */
          <div className="space-y-3">
            {filteredTraces.map((trace) => {
              const dateLabel = new Date(trace.timestamp).toLocaleTimeString();
              const isSelected = selectedTraceId === trace.id;

              return (
                <div
                  key={trace.id}
                  onClick={() => setSelectedTraceId(trace.id)}
                  className={`bg-[#FBFBFA] border rounded-xl p-4 hover:border-neutral-350 transition-all duration-300 cursor-pointer relative overflow-hidden ${
                    isSelected ? "border-neutral-400 bg-neutral-50/50 shadow-xs" : "border-neutral-200/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="p-1.5 rounded-lg bg-neutral-100 border border-neutral-200/50 text-[#171719] flex-shrink-0 font-mono text-[9px] font-bold">
                        {trace.model.includes("llama3") ? "LLAMA" : "MODEL"}
                      </span>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#171719] truncate max-w-[180px] sm:max-w-none">
                            {trace.model}
                          </span>
                          <span className="font-mono text-[9px] text-[#64748B] bg-white border border-neutral-200/50 px-1.5 py-0.2 rounded-md">
                            {trace.latency_ms}ms
                          </span>
                          <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded-md font-semibold">
                            ${trace.cost_usd ? trace.cost_usd.toFixed(5) : "0.00000"}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1.5 truncate max-w-sm sm:max-w-md md:max-w-xl">
                          Prompt: &quot;{trace.prompt}&quot;
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                      <span className="font-mono text-[10px] text-neutral-450">{dateLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* SESSION THREAD VIEW */
          <div className="space-y-4">
            {sessionThreads.map((session) => (
              <div
                key={session.id}
                className="border border-neutral-200/60 rounded-xl bg-[#FBFBFA] p-5.5 space-y-4 shadow-sm"
              >
                {/* Session Summary Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-neutral-200/40">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#171719]" />
                      <span className="font-bold text-xs text-[#171719] font-mono">
                        Session: {session.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-[#64748B] font-mono">
                      <span>Last active: {new Date(session.lastActive).toLocaleString()}</span>
                      <span>•</span>
                      <span>Avg latency: {session.avgLatency}ms</span>
                      <span>•</span>
                      <span>Total cost: ${session.totalCost.toFixed(5)}</span>
                    </div>
                  </div>
                  <span className="self-start sm:self-center font-mono text-[9px] text-[#64748B] bg-white border border-neutral-200/70 px-2 py-0.5 rounded-lg">
                    {session.model}
                  </span>
                </div>

                {/* Conversation Bubble Loop */}
                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {session.traces.map((trace) => (
                    <div key={trace.id} className="space-y-2">
                      {/* User Prompt (Right Align) */}
                      <div className="flex justify-end pl-12">
                        <div className="bg-[#171719] text-[#FBFBFA] px-4 py-2.5 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-lg shadow-sm">
                          <p className="font-medium">{trace.prompt}</p>
                          <span className="block text-[8px] text-neutral-400 mt-1 font-mono text-right">
                            {new Date(trace.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* AI Agent Response (Left Align) */}
                      <div className="flex justify-start pr-12">
                        <div
                          onClick={() => setSelectedTraceId(trace.id)}
                          className="bg-white border border-neutral-200/60 hover:border-neutral-350 cursor-pointer px-4 py-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-lg shadow-sm transition-all duration-300 group"
                        >
                          <p className="text-[#171719] font-normal leading-relaxed">{trace.response}</p>
                          <div className="flex items-center gap-2 mt-1.5 font-mono text-[8px] text-[#64748B] justify-between border-t border-neutral-100 pt-1">
                            <div className="flex gap-2.5">
                              <span>latency: {trace.latency_ms}ms</span>
                              <span>tokens: {trace.prompt_tokens + trace.completion_tokens}</span>
                            </div>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-neutral-500 font-sans font-bold">
                              Inspect Trace <ArrowRight className="w-2 h-2" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* METADATA SLIDING DETAIL DRAWER */}
      {selectedTraceId && activeTraceDetails && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-neutral-900/30 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
            onClick={() => setSelectedTraceId(null)}
          />

          {/* Drawer Body */}
          <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-white border-l border-neutral-200/50 shadow-2xl flex flex-col h-full transform transition-transform duration-300 animate-slide-in">
            {/* Drawer Header */}
            <div className="p-6 border-b border-neutral-200/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-[#171719]" />
                  <h3 className="font-bold text-sm text-[#171719] uppercase tracking-tight font-mono">
                    Trace Telemetry Audit
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-mono">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(activeTraceDetails.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTraceId(null)}
                className="p-1.5 rounded-xl border border-neutral-200/60 hover:bg-[#F5F5F0] text-neutral-450 hover:text-neutral-700 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Telemetry Core KPI cards */}
              <div className="grid grid-cols-3 gap-3 font-mono text-[#64748B]">
                <div className="p-3 bg-[#FBFBFA] rounded-xl border border-neutral-200/50 space-y-1">
                  <span className="text-[9px] font-bold uppercase block tracking-wider">Latency</span>
                  <span className="text-xs text-[#171719] font-bold block">
                    {activeTraceDetails.latency_ms}ms
                  </span>
                </div>
                <div className="p-3 bg-[#FBFBFA] rounded-xl border border-neutral-200/50 space-y-1">
                  <span className="text-[9px] font-bold uppercase block tracking-wider">Est. Cost</span>
                  <span className="text-xs text-emerald-700 font-bold block">
                    ${activeTraceDetails.cost_usd ? activeTraceDetails.cost_usd.toFixed(5) : "0.00000"}
                  </span>
                </div>
                <div className="p-3 bg-[#FBFBFA] rounded-xl border border-neutral-200/50 space-y-1">
                  <span className="text-[9px] font-bold uppercase block tracking-wider">Total Tokens</span>
                  <span className="text-xs text-[#171719] font-bold block">
                    {activeTraceDetails.prompt_tokens + activeTraceDetails.completion_tokens}
                  </span>
                </div>
              </div>

              {/* Identification details */}
              <div className="space-y-2 bg-[#FBFBFA] border border-neutral-200/50 rounded-xl p-4 text-xs font-mono">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#64748B] text-[10px]">Trace ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#171719] break-all select-all font-semibold">
                      {activeTraceDetails.id}
                    </span>
                    <button
                      onClick={() => handleCopy(activeTraceDetails.id, "drawer-trace")}
                      className="text-neutral-450 hover:text-neutral-700 transition-colors"
                    >
                      {copiedId === "drawer-trace" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-neutral-200/40 pt-2">
                  <span className="text-[#64748B] text-[10px]">Session ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#171719] break-all select-all font-semibold">
                      {activeTraceDetails.session_id || "global_session"}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(activeTraceDetails.session_id || "global_session", "drawer-session")
                      }
                      className="text-neutral-450 hover:text-neutral-700 transition-colors"
                    >
                      {copiedId === "drawer-session" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-neutral-200/40 pt-2">
                  <span className="text-[#64748B] text-[10px]">Model Node:</span>
                  <span className="text-[#171719] font-semibold">{activeTraceDetails.model}</span>
                </div>
              </div>

              {/* Prompt Block */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
                  Scrubbed Input Prompt
                </span>
                <div className="p-4 bg-[#FBFBFA] border border-neutral-200/50 rounded-xl leading-relaxed text-xs text-[#171719] whitespace-pre-wrap font-sans">
                  {activeTraceDetails.prompt}
                </div>
              </div>

              {/* Response Block */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
                  AI Generator Output
                </span>
                <div className="p-4 bg-[#FBFBFA] border border-neutral-200/50 rounded-xl leading-relaxed text-xs text-[#171719] whitespace-pre-wrap font-sans">
                  {activeTraceDetails.response}
                </div>
              </div>

              {/* Client Context Metadata */}
              {activeTraceDetails.metadata && Object.keys(activeTraceDetails.metadata).length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
                      Client Context Metadata
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(JSON.stringify(activeTraceDetails.metadata, null, 2), "drawer-json")
                      }
                      className="text-xs text-neutral-450 hover:text-neutral-700 flex items-center gap-1.5 font-semibold"
                    >
                      {copiedId === "drawer-json" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 text-[10px]">Copied payload</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-[#1E1E1E] border border-neutral-800 rounded-xl text-[11px] font-mono text-[#D1D1D1] overflow-x-auto shadow-inner">
                    <pre>{JSON.stringify(activeTraceDetails.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer actions */}
            <div className="p-6 border-t border-neutral-200/60 bg-[#FBFBFA] flex gap-3">
              <button
                onClick={() =>
                  handleCopy(
                    JSON.stringify(
                      {
                        trace_id: activeTraceDetails.id,
                        app_id: activeTraceDetails.app_id,
                        session_id: activeTraceDetails.session_id,
                        timestamp: activeTraceDetails.timestamp,
                        model: activeTraceDetails.model,
                        prompt: activeTraceDetails.prompt,
                        response: activeTraceDetails.response,
                        metrics: {
                          latency_ms: activeTraceDetails.latency_ms,
                          cost_usd: activeTraceDetails.cost_usd,
                          prompt_tokens: activeTraceDetails.prompt_tokens,
                          completion_tokens: activeTraceDetails.completion_tokens,
                        },
                      },
                      null,
                      2
                    ),
                    "drawer-export"
                  )
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-neutral-200/70 bg-white hover:bg-neutral-100 font-semibold text-xs text-[#171719] transition-all duration-300 active:scale-[0.98] shadow-sm"
              >
                {copiedId === "drawer-export" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied Full Export Data!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Export Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

