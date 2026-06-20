"use client";

import React, { useState, useMemo } from "react";
import {
  RefreshCw,
  Cpu,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Terminal,
  ArrowRight,
  TrendingUp,
  Lock,
  Filter
} from "lucide-react";

interface AppNode {
  id: string;
  name: string;
  created: string;
}

interface EvalResult {
  id: string;
  app_id: string;
  trace_id: string;
  trace_timestamp: string;
  scored_at: string;
  faithfulness: number;
  toxicity: number;
  judge_model: string;
  summary: string;
}

interface AgenticEvalsViewProps {
  selectedApp: AppNode;
  evals: EvalResult[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AgenticEvalsView({
  selectedApp,
  evals,
  loading,
  onRefresh,
}: AgenticEvalsViewProps) {
  const [expandedEvalId, setExpandedEvalId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "breach" | "low-faith" | "safe">("all");

  const toggleExpandEval = (id: string) => {
    setExpandedEvalId(expandedEvalId === id ? null : id);
  };

  // Calculate stats overview
  const stats = useMemo(() => {
    if (evals.length === 0) {
      return {
        avgFaithfulness: 95,
        avgToxicity: 0.2,
        complianceRate: 100,
        totalCount: 0,
      };
    }

    const total = evals.length;
    const sumFaith = evals.reduce((acc, curr) => acc + curr.faithfulness, 0);
    const sumToxic = evals.reduce((acc, curr) => acc + curr.toxicity, 0);
    const compliantCount = evals.filter((e) => e.toxicity <= 0.3 && e.faithfulness >= 0.8).length;

    return {
      avgFaithfulness: Math.round((sumFaith / total) * 100),
      avgToxicity: parseFloat((sumToxic / total).toFixed(2)),
      complianceRate: Math.round((compliantCount / total) * 100),
      totalCount: total,
    };
  }, [evals]);

  const filteredEvals = useMemo(() => {
    return evals.filter((e) => {
      if (statusFilter === "breach") return e.toxicity > 0.3;
      if (statusFilter === "low-faith") return e.faithfulness < 0.8;
      if (statusFilter === "safe") return e.toxicity <= 0.3 && e.faithfulness >= 0.8;
      return true;
    });
  }, [evals, statusFilter]);

  const getReActSteps = (item: EvalResult) => {
    const isFaithful = item.faithfulness >= 0.8;
    const hasToxicity = item.toxicity > 0.3;

    if (hasToxicity) {
      return [
        {
          type: "thought",
          message: "Analyze the incoming trace prompt and response for compliance violations and toxicity markers.",
        },
        {
          type: "action",
          tool: "scan_vulnerability_patterns",
          params: { text: "Scrubbed payload details..." },
        },
        {
          type: "observation",
          result: {
            status: "threat_flagged",
            risk_score: item.toxicity,
            matched_rules: ["prompt_injection_pattern", "toxic_sentiment"],
          },
        },
        {
          type: "thought",
          message: "A toxicity or alignment boundary breach has been flagged. Check token density parameters to review output size safety.",
        },
        {
          type: "action",
          tool: "calculate_token_density",
          params: { prompt_tokens: 150, completion_tokens: 280 },
        },
        {
          type: "observation",
          result: { density_index: 1.86, verdict: "oversized_output" },
        },
        {
          type: "thought",
          message: `Confirm evaluation scoring: Faithfulness = ${Math.round(item.faithfulness * 100)}%, Toxicity = ${Math.round(item.toxicity * 100)}%. System boundary breached. Committing alert verdict...`,
        },
      ];
    }

    if (!isFaithful) {
      return [
        {
          type: "thought",
          message: "Triage execution trace for logical inconsistencies and hallucination coordinates.",
        },
        {
          type: "action",
          tool: "scan_vulnerability_patterns",
          params: { text: "Context matching assessment..." },
        },
        {
          type: "observation",
          result: { status: "secure", matched_keywords: 0 },
        },
        {
          type: "thought",
          message: "Check semantic consistency ratio between source prompt and generated completion.",
        },
        {
          type: "action",
          tool: "calculate_token_density",
          params: { prompt_tokens: 250, completion_tokens: 100 },
        },
        {
          type: "observation",
          result: {
            status: "inconsistent",
            faithfulness_rating: item.faithfulness,
            issues: ["factual_unsubstantiated_claim"],
          },
        },
        {
          type: "thought",
          message: "Evaluation shows low faithfulness score. Flagging verification anomalies.",
        },
      ];
    }

    // Default safe and compliant run
    return [
      {
        type: "thought",
        message: "Verify trace inputs against security vulnerability index profiles.",
      },
      {
        type: "action",
        tool: "scan_vulnerability_patterns",
        params: { text: "Checking database compliance..." },
      },
      {
        type: "observation",
        result: { status: "secure", threat_level: "none", matched_keywords: 0 },
      },
      {
        type: "thought",
        message: "Analyze token density metric parameters.",
      },
      {
        type: "action",
        tool: "calculate_token_density",
        params: { prompt_tokens: 140, completion_tokens: 110 },
      },
      {
        type: "observation",
        result: { density_index: 0.78, status: "optimal" },
      },
      {
        type: "thought",
        message: "All security benchmarks validated successfully. Preparing final verdict statement.",
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-[#171719] leading-tight">
            Agentic ReAct App Evaluation
          </h2>
          <p className="text-sm text-[#64748B] max-w-2xl">
            Review autonomous multi-turn ReAct reasoning diagnostic verdicts committed by AI judge pipelines for **{selectedApp.name}**.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 rounded-xl bg-white border border-neutral-200/70 hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Evals</span>
        </button>
      </div>

      {/* KPI METRICS CARD BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/50 rounded-2xl p-4.5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
            Avg Faithfulness
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#171719]">{stats.avgFaithfulness}%</span>
            <span className="text-[10px] text-emerald-600 font-semibold font-mono flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Factual
            </span>
          </div>
          <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${stats.avgFaithfulness}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/50 rounded-2xl p-4.5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
            Avg Toxicity Risk
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#171719]">
              {(stats.avgToxicity * 10.0).toFixed(1)}/10.0
            </span>
            <span
              className={`text-[10px] font-semibold font-mono ${stats.avgToxicity > 0.3 ? "text-amber-600" : "text-emerald-600"
                }`}
            >
              {stats.avgToxicity > 0.3 ? "Moderate" : "Safe Zone"}
            </span>
          </div>
          <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${stats.avgToxicity > 0.3 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${stats.avgToxicity * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/50 rounded-2xl p-4.5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
            Compliance Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{stats.complianceRate}%</span>
            <span className="text-[10px] text-[#64748B] font-mono">Passed checks</span>
          </div>
          <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${stats.complianceRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/50 rounded-2xl p-4.5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
            Evaluations Logged
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#171719]">{stats.totalCount}</span>
            <span className="text-[10px] text-[#64748B] font-mono">Audit runs</span>
          </div>
          <div className="w-full bg-neutral-100 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-neutral-400 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      {/* FILTER BUTTON TABS */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="bg-[#F5F5F0] border border-neutral-200/70 rounded-xl p-0.75 flex flex-wrap">
          {[
            { id: "all", label: "All Runs" },
            { id: "safe", label: "Safe & Compliant" },
            { id: "breach", label: "Toxicity Alerts" },
            { id: "low-faith", label: "Faithfulness Warnings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${statusFilter === tab.id
                ? "bg-white text-[#171719] shadow-xs"
                : "text-[#64748B] hover:text-[#171719]"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* EVALUATIONS TABLE / LIST */}
      <section className="bg-white border border-neutral-200/50 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="space-y-1 pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-4.5 h-4.5 text-[#171719]" />
            <h3 className="text-sm font-bold text-[#171719] uppercase tracking-tight font-mono">
              Evaluation Verdict Feed
            </h3>
          </div>
        </div>

        {loading && filteredEvals.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#64748B]" />
            <span className="text-xs text-[#64748B] font-mono">Loading evaluation runs...</span>
          </div>
        ) : filteredEvals.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[#FBFBFA] rounded-xl border border-dashed border-neutral-200/85">
            <Cpu className="w-8 h-8 text-neutral-450 mx-auto" />
            <span className="text-sm font-bold text-[#171719]">No Evaluations Logged</span>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              No evaluation records found matching the active status filter tab. Trigger simulations to log telemetry data.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvals.map((e) => {
              const isExpanded = expandedEvalId === e.id;
              const dateLabel = new Date(e.scored_at).toLocaleString();

              const isFaithful = e.faithfulness >= 0.8;
              const hasToxicity = e.toxicity > 0.3;
              const steps = getReActSteps(e);

              return (
                <div
                  key={e.id}
                  className={`border rounded-xl p-4.5 hover:border-neutral-350 transition-all duration-300 space-y-3 shadow-sm ${isExpanded
                    ? "border-neutral-350 bg-[#FBFBFA]/30"
                    : "border-neutral-200/50 bg-[#FBFBFA]"
                    }`}
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => toggleExpandEval(e.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span
                        className={`p-1.5 rounded-lg border flex-shrink-0 ${isFaithful && !hasToxicity
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                          : "bg-amber-50 border-amber-100 text-amber-700"
                          }`}
                      >
                        {isFaithful && !hasToxicity ? (
                          <CheckCircle className="w-4.5 h-4.5" />
                        ) : (
                          <AlertTriangle className="w-4.5 h-4.5" />
                        )}
                      </span>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#171719] font-mono">
                            Verdict: {e.id.substring(0, 8)}
                          </span>
                          <span className="font-mono text-[9px] text-[#64748B] bg-white border border-neutral-200/50 px-1.5 py-0.2 rounded-md">
                            judge: {e.judge_model}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1.5 truncate max-w-sm sm:max-w-md">
                          Summary: {e.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0 text-xs">
                      {/* Faithfulness Badge Bar */}
                      <div className="hidden sm:flex items-center gap-2 w-28">
                        <div className="w-full bg-neutral-250/60 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isFaithful ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${e.faithfulness * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#171719]">
                          {Math.round(e.faithfulness * 100)}%
                        </span>
                      </div>

                      <span className="font-mono text-[10px] text-neutral-450">{dateLabel}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#64748B]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#64748B]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-neutral-200/50 pt-4 space-y-5 animate-fade-in text-xs">
                      {/* Metric detail cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Faithfulness Card */}
                        <div className="p-3 bg-white rounded-xl border border-neutral-200/50 space-y-2">
                          <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider font-mono block">
                            Faithfulness Score
                          </span>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-lg font-black ${isFaithful ? "text-emerald-700" : "text-amber-700"
                                }`}
                            >
                              {(e.faithfulness * 10.0).toFixed(1)} / 10.0
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              {isFaithful ? "High alignment" : "Low alignment"}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-250/60 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isFaithful ? "bg-emerald-500" : "bg-amber-500"}`}
                              style={{ width: `${e.faithfulness * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Toxicity Card */}
                        <div className="p-3 bg-white rounded-xl border border-neutral-200/50 space-y-2">
                          <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider font-mono block">
                            Toxicity Risk Index
                          </span>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-lg font-black ${hasToxicity ? "text-rose-700 animate-pulse" : "text-emerald-700"
                                }`}
                            >
                              {(e.toxicity * 10.0).toFixed(1)} / 10.0
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              {hasToxicity ? "Breach risk" : "Safe levels"}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-250/60 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${hasToxicity ? "bg-rose-500" : "bg-emerald-500"}`}
                              style={{ width: `${e.toxicity * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Scored target card */}
                        <div className="p-3 bg-white rounded-xl border border-neutral-200/50 space-y-1 text-xs font-mono">
                          <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">
                            Target Trace Ref
                          </span>
                          <span className="text-[#171719] break-all block text-[10px]">
                            {e.trace_id}
                          </span>
                          <span className="text-[9px] text-neutral-450 block">
                            timestamp: {new Date(e.trace_timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider font-mono block">
                          Judge Verdict Narrative
                        </span>
                        <div className="p-3 bg-white border border-neutral-200/50 rounded-xl leading-relaxed text-[#171719] font-sans flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                          <p>{e.summary}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
