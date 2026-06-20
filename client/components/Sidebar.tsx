"use client";

import React from "react";
import {
  Activity,
  Database,
  Shield,
  TrendingUp,
  Cpu,
  Key,
  ChevronLeft
} from "lucide-react";

interface AppNode {
  id: string;
  name: string;
  created: string;
}

interface SidebarProps {
  selectedApp: AppNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchApp: () => void;
}

export default function Sidebar({
  selectedApp,
  activeTab,
  setActiveTab,
  onSwitchApp,
}: SidebarProps) {
  return (
    <aside className="w-66 flex flex-col justify-between bg-[#F5F5F0] border-r border-neutral-200/50 p-5 flex-shrink-0 z-20">
      <div className="space-y-8">
        {/* Logo Brand area */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#171719] flex items-center justify-center text-[#F5F5F0] font-black tracking-tighter text-sm shadow-sm">
            SF
          </div>
          <div>
            <h2 className="font-bold tracking-tight text-[#171719] text-sm leading-none font-sans">
              SpectraFlow
            </h2>
            <span className="text-[9px] text-[#64748B] tracking-wider uppercase font-mono mt-1 block">
              AI Observability
            </span>
          </div>
        </div>

        {/* Active Application Context summary */}
        <div className="p-3.5 bg-white rounded-xl border border-neutral-200/50 space-y-2 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-8 -mt-8" />
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
              Active Target
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-xs text-[#171719] truncate">{selectedApp.name}</div>
            <div className="text-[10px] text-neutral-450 font-mono truncate">{selectedApp.id}</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "traces", label: "Traces & Logs", icon: Database },
            { id: "anomalies", label: "Anomaly Detection", icon: Shield },
            { id: "drift", label: "Model Drift", icon: TrendingUp },
            { id: "evals", label: "Agentic Evaluation", icon: Cpu },
            { id: "sdk-settings", label: "SDK Settings & API Keys", icon: Key },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-white border border-neutral-200/50 text-[#171719] shadow-sm font-semibold"
                    : "text-[#64748B] hover:text-[#171719] hover:bg-white/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#171719]" : "text-[#64748B]"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Change App Button & profile footer */}
      <div className="space-y-4">
        <button
          onClick={onSwitchApp}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-3 rounded-xl border border-neutral-200/70 bg-white hover:bg-neutral-100 text-[#171719] transition-all duration-300 active:scale-[0.98] shadow-sm animate-fade-in"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Switch Application</span>
        </button>

        <div className="border-t border-neutral-200/60 pt-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-neutral-350/50 flex items-center justify-center font-bold text-xs text-[#171719]">
              JD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#171719] truncate font-sans">
                Principal Architect
              </p>
              <p className="text-[10px] text-[#64748B] truncate font-mono">
                org_id: spectraflow_core
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
