"use client";

import React from "react";
import { Briefcase, Plus, RefreshCw, Copy, Check, ChevronRight } from "lucide-react";

interface AppNode {
  id: string;
  name: string;
  created: string;
}

interface AppRegistryProps {
  apps: AppNode[];
  loadingApps: boolean;
  newAppName: string;
  setNewAppName: (val: string) => void;
  createdAppId: string | null;
  copiedAppId: boolean;
  isCreatingApp: boolean;
  handleRegisterApp: (e: React.FormEvent) => void;
  handleCopyAppId: (id: string) => void;
  onSelectApp: (app: AppNode) => void;
}

export default function AppRegistry({
  apps,
  loadingApps,
  newAppName,
  setNewAppName,
  createdAppId,
  copiedAppId,
  isCreatingApp,
  handleRegisterApp,
  handleCopyAppId,
  onSelectApp,
}: AppRegistryProps) {
  return (
    <div className="min-h-screen w-screen bg-[#FBFBFA] text-[#171719] font-sans antialiased flex flex-col justify-between overflow-y-auto">
      {/* Top Minimal Bar */}
      <header className="h-16 border-b border-neutral-200/50 bg-white px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#171719] flex items-center justify-center text-[#F5F5F0] font-black tracking-tighter text-sm">
            SF
          </div>
          <h1 className="text-sm font-bold tracking-tight text-[#171719]">
            SpectraFlow // Application Registry
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/50">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-400"></span>
          </span>
          <span className="text-[10px] font-bold text-neutral-600 tracking-wider uppercase font-mono">
            STANDBY CONFIG STATE
          </span>
        </div>
      </header>

      {/* Content Body */}
      <div className="flex-1 p-8 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-8">
        {/* Left panel: List of Apps */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-[#171719]">
              Select Active Application
            </h2>
            <p className="text-sm text-[#64748B]">
              Specify the target deployment context to configure telemetrics, analyze logs, and query embedding space models.
            </p>
          </div>

          {loadingApps ? (
            <div className="bg-white border border-neutral-200/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#64748B]" />
              <span className="text-xs text-[#64748B] font-mono">Loading registry entries...</span>
            </div>
          ) : apps.length === 0 ? (
            <div className="bg-white border border-neutral-200/50 rounded-2xl p-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-[#F5F5F0] flex items-center justify-center text-[#64748B] mx-auto">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#171719]">No Applications Registered</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                Get started by creating a new app node context on the right panel to get your custom App ID for SDK hookups.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="group bg-white border border-neutral-200/50 rounded-2xl p-5 hover:border-neutral-350 transition-all duration-300 flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#171719] text-sm group-hover:text-black transition-colors">
                        {app.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-[#F5F5F0] border border-neutral-200/50 text-[#64748B]">
                        Active Node
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-mono">
                      <span className="truncate max-w-[280px]">ID: {app.id}</span>
                      <span>•</span>
                      <span>{app.created}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleCopyAppId(app.id)}
                      className="p-2.5 rounded-xl border border-neutral-200/70 hover:bg-[#F5F5F0] text-neutral-500 hover:text-[#171719] transition-all"
                      title="Copy App ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectApp(app)}
                      className="flex items-center gap-1 text-xs font-semibold py-2.5 px-4 rounded-xl bg-[#171719] hover:bg-neutral-800 text-white border-transparent transition-all duration-300 active:scale-[0.98]"
                    >
                      <span>Select Context</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel: Create New App */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-200/50 rounded-2xl p-6 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#171719]" />
                <h3 className="text-sm font-bold text-[#171719] uppercase tracking-tight font-mono">
                  Register App Node
                </h3>
              </div>
              <p className="text-xs text-[#64748B]">
                Instantiate a new hypertable and pgvector context mapped to your app deployment identifier.
              </p>
            </div>

            <form onSubmit={handleRegisterApp} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#171719]">Application Node Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chatbot Service Production"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-neutral-200/70 rounded-xl text-sm focus:outline-none focus:border-neutral-400 bg-[#FBFBFA] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingApp}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-3 px-4 rounded-xl bg-[#171719] hover:bg-neutral-800 text-white border-transparent transition-all duration-300 active:scale-[0.98] disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
              >
                {isCreatingApp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning Database Tables...</span>
                  </>
                ) : (
                  <span>Register New App</span>
                )}
              </button>
            </form>

            {/* Show created app success banner */}
            {createdAppId && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-800">App Registered Successfully</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-normal">
                      Your dual-write timeseries tables have been provisioned on TimescaleDB. Copy the unique identifier below:
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-lg p-2.5 border border-emerald-200/50 font-mono text-[11px] text-[#171719] justify-between overflow-x-auto">
                  <span className="font-bold tracking-tight select-all">{createdAppId}</span>
                  <button
                    onClick={() => handleCopyAppId(createdAppId)}
                    className="text-emerald-700 hover:text-emerald-900 transition-colors p-1"
                    title="Copy App ID"
                  >
                    {copiedAppId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-16 border-t border-neutral-200/50 bg-white px-8 flex items-center justify-between text-[11px] text-[#64748B] font-mono">
        <span>SpectraFlow // Platform Registry Engine v0.1.0</span>
        <span>Dual-Write Postgres + pgvector + TimescaleDB active</span>
      </footer>
    </div>
  );
}
