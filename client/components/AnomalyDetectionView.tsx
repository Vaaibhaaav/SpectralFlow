"use client";

import React, { useState } from "react";
import { RefreshCw, Shield, AlertTriangle, Cpu, Terminal, ChevronDown, ChevronUp } from "lucide-react";

interface AppNode {
  id: string;
  name: string;
  created: string;
}

interface AlertEvent {
  id: string;
  app_id: string;
  type: string;
  message: string;
  payload: string;
  timestamp: string;
}

interface AnomalyDetectionProps {
  selectedApp: AppNode;
  alerts: AlertEvent[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AnomalyDetectionView({
  selectedApp,
  alerts,
  loading,
  onRefresh,
}: AnomalyDetectionProps) {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const toggleExpandAlert = (id: string) => {
    setExpandedAlertId(expandedAlertId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-[#171719] leading-tight">
            Anomaly & Threshold Breaches
          </h2>
          <p className="text-sm text-[#64748B] max-w-2xl">
            Live stream statistical deviations tracked via specialized exponential Welford algorithms for **{selectedApp.name}**.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 rounded-xl bg-white border border-neutral-200/70 hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Incident Log</span>
        </button>
      </div>

      {/* Stats Counter Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono block mb-1">
              Active Alerts Count
            </span>
            <span className="text-2xl font-black text-[#171719] tracking-tight">{alerts.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono block mb-1">
              Welford Variance Weight (α)
            </span>
            <span className="text-2xl font-black text-[#171719] tracking-tight">0.20</span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200/50 text-[#171719]">
            <Terminal className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-neutral-200/50 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider font-mono block mb-1">
              Downstream AI Judge Agent
            </span>
            <span className="text-2xl font-black text-[#171719] tracking-tight">Groq LPU active</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Incident List */}
      <section className="bg-white border border-neutral-200/50 rounded-2xl p-6 space-y-4">
        <div className="space-y-1 pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-[#171719]" />
            <h3 className="text-sm font-bold text-[#171719] uppercase tracking-tight font-mono">
              Live Threshold Warning Feed
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#64748B]" />
            <span className="text-xs text-[#64748B] font-mono">Loading active incidents...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[#FBFBFA] rounded-xl border border-dashed border-neutral-200/85">
            <Shield className="w-8 h-8 text-neutral-450 mx-auto" />
            <span className="text-sm font-bold text-[#171719]">No Incidents Logged</span>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Everything is running normally. Exponential moving deviations are within safe limits.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isExpanded = expandedAlertId === alert.id;
              const timestampLabel = new Date(alert.timestamp).toLocaleString();
              return (
                <div
                  key={alert.id}
                  className="bg-[#FBFBFA] border border-neutral-200/50 rounded-xl p-4.5 hover:border-neutral-300 transition-all duration-300 space-y-3 shadow-sm"
                >
                  <div
                    onClick={() => toggleExpandAlert(alert.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 flex-shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[#171719] font-mono uppercase">
                            {alert.type || "LATENCY WARNING"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-rose-100/60 text-rose-700 border border-rose-200/50">
                            Critical deviation
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-1 truncate max-w-xl">{alert.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 text-xs">
                      <span className="font-mono text-[10px] text-neutral-450">{timestampLabel}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-neutral-200/50 pt-3 space-y-3 animate-fade-in">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
                          Trace Reference ID
                        </span>
                        <p className="text-xs font-mono text-[#171719] break-all">{alert.id}</p>
                      </div>

                      {alert.payload && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
                            Diagnostic Payload JSON
                          </span>
                          <div className="bg-[#1E1E1E] border border-neutral-800 rounded-lg p-3 font-mono text-[11px] text-[#D1D1D1] overflow-x-auto leading-relaxed shadow-inner">
                            <pre>{JSON.stringify(JSON.parse(alert.payload), null, 2)}</pre>
                          </div>
                        </div>
                      )}
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
