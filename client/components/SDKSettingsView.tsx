"use client";

import React from "react";
import {
  Terminal,
  ChevronRight,
  Check,
  Copy,
  Play,
  Zap,
  Key,
  Plus,
  EyeOff,
  Eye,
  Trash2,
  Settings,
  RefreshCw,
  CheckCircle
} from "lucide-react";

interface AppNode {
  id: string;
  name: string;
  created: string;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  created: string;
  lastUsed: string;
  status: "active" | "revoked";
}

interface SDKSettingsViewProps {
  selectedApp: AppNode;
  gatewayUrl: string;
  setGatewayUrl: (url: string) => void;
  maxConcurrency: number;
  setMaxConcurrency: (n: number) => void;
  timeoutMs: number;
  setTimeoutMs: (n: number) => void;
  ewmaAlpha: number;
  setEwmaAlpha: (n: number) => void;
  driftBatchSize: number;
  setDriftBatchSize: (n: number) => void;
  piiScrubbing: boolean;
  setPiiScrubbing: (b: boolean) => void;
  isSaving: boolean;
  saveSuccess: boolean;
  handleSaveSettings: () => void;
  apiKeys: APIKey[];
  copiedKeyId: string | null;
  revealedKeys: Record<string, boolean>;
  toggleKeyReveal: (id: string) => void;
  handleCopy: (text: string, id: string) => void;
  handleRevokeKey: (id: string) => void;
  setShowCreateModal: (show: boolean) => void;
  setGeneratedKey: (val: string | null) => void;
  simulating: boolean;
  simStep: number;
  simLogs: string[];
  triggerSimulation: () => void;
  copiedStep1: boolean;
  copiedStep2: boolean;
}

export default function SDKSettingsView({
  selectedApp,
  gatewayUrl,
  setGatewayUrl,
  maxConcurrency,
  setMaxConcurrency,
  timeoutMs,
  setTimeoutMs,
  ewmaAlpha,
  setEwmaAlpha,
  driftBatchSize,
  setDriftBatchSize,
  piiScrubbing,
  setPiiScrubbing,
  isSaving,
  saveSuccess,
  handleSaveSettings,
  apiKeys,
  copiedKeyId,
  revealedKeys,
  toggleKeyReveal,
  handleCopy,
  handleRevokeKey,
  setShowCreateModal,
  setGeneratedKey,
  simulating,
  simStep,
  simLogs,
  triggerSimulation,
  copiedStep1,
  copiedStep2,
}: SDKSettingsViewProps) {
  return (
    <div className="blur-sm">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-[#171719] leading-tight">
          SDK Settings & Credentials
        </h2>
        <p className="text-sm text-[#64748B] max-w-2xl">
          Configure Go-based application endpoints, fine-tune Welford EWMA anomaly parameters, and manage secure API keys for **{selectedApp.name}**.
        </p>
      </div>

      {/* 2. RECTILINEAR 3-STEP DEPENDENCY PIPELINE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4.5 h-4.5 text-[#171719]" />
          <h3 className="text-sm font-bold text-[#171719] tracking-tight uppercase font-mono">
            Go Integration Pipeline
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* STEP 1: Source Acquisition */}
          <div className="lg:col-span-3 flex flex-col bg-white border border-neutral-200/50 rounded-xl p-5 justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] font-mono">Step 1 // Get Library</span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">Ready</span>
              </div>
              <h4 className="text-sm font-bold text-[#171719] mb-1">Source Acquisition</h4>
              <p className="text-xs text-[#64748B] mb-4">Pull the Go SDK telemetry client directly from the package registry.</p>
              
              {/* Code Shell panel */}
              <div className="bg-[#F5F5F0] rounded-lg p-3 border border-neutral-200/50 flex items-center justify-between font-mono text-xs select-all overflow-x-auto text-[#64748B] font-medium leading-none">
                <code>go get spectraflow-sdk/client</code>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => handleCopy("go get spectraflow-sdk/client", "step1")}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl border border-neutral-200/70 bg-white hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98]"
              >
                {copiedStep1 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied Command</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Connecting Chevron (Hidden on small viewports) */}
          <div className="hidden lg:flex col-span-1 items-center justify-center -mx-4 z-10">
            <ChevronRight className="w-6 h-6 text-neutral-300" />
          </div>

          {/* STEP 2: The Code Engine Canvas */}
          <div className="lg:col-span-4 flex flex-col bg-white border border-neutral-200/50 rounded-xl p-5 justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] font-mono">Step 2 // Instantiate SDK</span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-blue-50 text-blue-700 font-bold border border-blue-100">Setup</span>
              </div>
              <h4 className="text-sm font-bold text-[#171719] mb-1">The Code Engine Canvas</h4>
              <p className="text-xs text-[#64748B] mb-4">Initialize the client with your local gateway URL and selected app identifier.</p>
              
              {/* Code Mock with syntax highlighting matching theme */}
              <div className="bg-[#1E1E1E] rounded-xl p-4 border border-neutral-800 font-mono text-[11px] overflow-x-auto text-[#D1D1D1] leading-relaxed shadow-lg select-all">
                <div>
                  <span className="text-[#8F9E8B]">package</span> main
                </div>
                <div className="mt-1">
                  <span className="text-[#8F9E8B]">import</span> (
                  <div className="pl-4 text-[#7C7C75]">
                    &quot;context&quot;<br />
                    &quot;spectraflow/client&quot;
                  </div>
                  )
                </div>
                <div className="mt-2 text-[#7C7C75]">
                  // Initialize connection client
                </div>
                <div>
                  sf := client.<span className="text-[#C5A059] font-medium">NewSpectraflowClient</span>(
                  <div className="pl-4">
                    <span className="text-[#C5A059]">&quot;{gatewayUrl}&quot;</span>,<br />
                    <span className="text-[#C5A059]">&quot;{selectedApp.id}&quot;</span>,<br />
                    <span className="text-[#C5A059]">&quot;sf_live_8f391...&quot;</span>,
                  </div>
                  )
                </div>
                <div className="mt-2 text-[#7C7C75]">
                  // Auto-ship chat trace
                </div>
                <div>
                  res, err := sf.<span className="text-[#C5A059] font-medium">Completion</span>(ctx, <span className="text-[#C5A059]">&quot;llama3&quot;</span>, prompt)
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => handleCopy(
                  `package main\n\nimport (\n\t"context"\n\t"spectraflow/client"\n)\n\nfunc main() {\n\tctx := context.Background()\n\tsf := client.NewSpectraflowClient("${gatewayUrl}", "${selectedApp.id}", "sf_live_8f391bde28e411c009d17d")\n\tres, err := sf.Completion(ctx, "llama3-70b-8192", "Perform root-cause evaluation.")\n}`, 
                  "step2"
                )}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl border border-neutral-200/70 bg-white hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98]"
              >
                {copiedStep2 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied Template</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Copy Full Go Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Connecting Chevron (Hidden on small viewports) */}
          <div className="hidden lg:flex col-span-1 items-center justify-center -mx-4 z-10">
            <ChevronRight className="w-6 h-6 text-neutral-300" />
          </div>

          {/* STEP 3: Stream Ingestion Verification */}
          <div className="lg:col-span-3 flex flex-col bg-white border border-neutral-200/50 rounded-xl p-5 justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] font-mono">Step 3 // Fan-Out Verify</span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border ${simulating ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse" : "bg-purple-50 text-purple-700 border-purple-100"}`}>
                  {simulating ? "Streaming..." : "Active"}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#171719] mb-1">Stream Verification</h4>
              <p className="text-xs text-[#64748B] mb-3">Trace pipelines fan-out asynchronously across the background worker grid.</p>
              
              {/* Flow Visualization Box */}
              <div className="bg-[#FBFBFA] rounded-xl p-3 border border-neutral-200/50 flex flex-col gap-2 font-mono text-[10px]">
                <div className="flex items-center justify-between border-b border-neutral-200/50 pb-1">
                  <span className="text-[#64748B] font-bold">GRID PIPELINE NODES</span>
                  <span className="text-neutral-400">STATUS</span>
                </div>
                
                {/* Pipeline Node List */}
                <div className="space-y-1">
                  {[
                    { step: 1, name: "Go Client hand-off", active: simStep >= 1, color: "bg-emerald-500" },
                    { step: 2, name: "Gateway (Port 8080)", active: simStep >= 2, color: "bg-teal-500" },
                    { step: 3, name: "TimescaleDB Indexer", active: simStep >= 3, color: "bg-blue-500" },
                    { step: 3, name: "pgvector Embedding Node", active: simStep >= 3, color: "bg-indigo-500" },
                    { step: 4, name: "Welford EWMA Anomaly", active: simStep >= 4, color: "bg-amber-500" },
                    { step: 5, name: "Drift Cosine Engine", active: simStep >= 5, color: "bg-purple-500" },
                  ].map((node, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${node.active ? node.color : "bg-neutral-300"} transition-all duration-300`} />
                        <span className={node.active ? "text-[#171719] font-medium" : "text-[#64748B]"}>{node.name}</span>
                      </div>
                      <span className={node.active ? "text-emerald-700 font-bold" : "text-neutral-400"}>
                        {node.active ? "OK" : "Idle"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={triggerSimulation}
                disabled={simulating}
                className={`w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl border border-neutral-200/70 transition-all duration-300 active:scale-[0.98] ${
                  simulating 
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200" 
                    : "bg-[#171719] hover:bg-neutral-800 text-white border-transparent"
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${simulating ? "animate-spin" : ""}`} />
                <span>{simulating ? "Simulating Stream..." : "Simulate Telemetry Stream"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SIMULATION REALTIME LOG PANEL */}
        {simLogs.length > 0 && (
          <div className="bg-white border border-neutral-200/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#C5A059]" />
                <h4 className="text-xs font-bold font-mono text-[#171719] tracking-tight uppercase">Live Channel Ingest Log</h4>
              </div>
              <span className="text-[10px] text-[#64748B] font-mono">Topic: TraceEvent Fanout</span>
            </div>

            <div className="bg-[#1E1E1E] border border-neutral-800 rounded-xl p-4 font-mono text-xs text-[#D1D1D1] space-y-1 max-h-48 overflow-y-auto">
              {simLogs.map((log, index) => {
                const isWarning = log.includes("WARNING");
                const isSuccess = log.includes("complete") || log.includes("handshake");
                let colorClass = "text-[#D1D1D1]";
                if (isWarning) colorClass = "text-amber-400 font-semibold";
                else if (isSuccess) colorClass = "text-emerald-400";
                else if (log.includes("[SDK Client]")) colorClass = "text-blue-400";
                else if (log.includes("[Gateway")) colorClass = "text-teal-400";
                else if (log.includes("[Indexer") || log.includes("[Vector")) colorClass = "text-indigo-400";

                return (
                  <div key={index} className="flex gap-2">
                    <span className="text-[#64748B] select-none">{(index + 1).toString().padStart(2, "0")}.</span>
                    <span className={colorClass}>{log}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* 3. API KEYS MANAGER */}
        <section className="xl:col-span-8 bg-white border border-neutral-200/50 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="w-4.5 h-4.5 text-[#171719]" />
                <h3 className="text-sm font-bold text-[#171719] tracking-tight uppercase font-mono">Authentication Credentials</h3>
              </div>
              <p className="text-xs text-[#64748B]">
                Cryptographically secure API keys to authorize telemetry requests and event ingestion for this app.
              </p>
            </div>

            <button
              onClick={() => {
                setGeneratedKey(null);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-white border border-neutral-200/70 hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-[#64748B]" />
              <span>Generate API Key</span>
            </button>
          </div>

          {/* API Keys Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200/50 text-[10px] tracking-wider uppercase font-mono text-[#64748B]">
                  <th className="pb-3 font-semibold">Key Name</th>
                  <th className="pb-3 font-semibold">Credential Token</th>
                  <th className="pb-3 font-semibold">Assigned Scopes</th>
                  <th className="pb-3 font-semibold">Created / Last Used</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/30 text-xs">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="group hover:bg-[#FBFBFA]/60 transition-colors">
                    <td className="py-4 font-semibold text-[#171719] max-w-[150px] truncate">
                      {key.name}
                    </td>
                    <td className="py-4 font-mono text-[#64748B]">
                      <div className="flex items-center gap-2">
                        <span className="tracking-tight">
                          {revealedKeys[key.id] 
                            ? key.key 
                            : `${key.key.substring(0, 10)}****************`}
                        </span>
                        <button
                          onClick={() => toggleKeyReveal(key.id)}
                          className="text-neutral-400 hover:text-[#171719] transition-colors p-1"
                          title={revealedKeys[key.id] ? "Hide Key" : "Reveal Key"}
                        >
                          {revealedKeys[key.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(key.key, key.id)}
                          className="text-neutral-400 hover:text-[#171719] transition-colors p-1"
                          title="Copy Key"
                        >
                          {copiedKeyId === key.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-[#F5F5F0] text-[#64748B] border border-neutral-200/50"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 text-[#64748B]">
                      <div>{key.created}</div>
                      <div className="text-[10px] text-neutral-400">{key.lastUsed}</div>
                    </td>
                    <td className="py-4">
                      {key.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1 h-1 rounded-full bg-emerald-600 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-neutral-100 text-neutral-500 border border-neutral-200/50">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {key.status === "active" && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="text-neutral-400 hover:text-rose-600 transition-colors py-1 px-2 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 active:scale-[0.96]"
                          title="Revoke Token"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. SDK SETTINGS & ADVANCED TUNING */}
        <section className="xl:col-span-4 bg-white border border-neutral-200/50 rounded-xl p-6 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-[#171719]" />
              <h3 className="text-sm font-bold text-[#171719] tracking-tight uppercase font-mono">SDK Tuning & Controls</h3>
            </div>
            <p className="text-xs text-[#64748B]">
              Configure connection timeouts, batch queue boundaries, and analytical threshold values.
            </p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Gateway URL endpoint */}
            <div className="space-y-1.5">
              <label className="font-semibold text-[#171719] block">Ingestion Router Target</label>
              <input
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200/70 rounded-xl font-mono text-[#171719] focus:outline-none focus:border-neutral-400 bg-[#FBFBFA] transition-colors"
              />
            </div>

            {/* Max Concurrency Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-semibold text-[#171719]">Max Connection Workers</label>
                <span className="font-mono text-[#64748B] font-bold">{maxConcurrency} workers</span>
              </div>
              <input
                type="range"
                min="5"
                max="200"
                value={maxConcurrency}
                onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                className="w-full accent-[#171719] bg-neutral-100 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Client Timeout Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-semibold text-[#171719]">Telemetry Gateway Timeout</label>
                <span className="font-mono text-[#64748B] font-bold">{timeoutMs} ms</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(Number(e.target.value))}
                className="w-full accent-[#171719] bg-neutral-100 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Anomaly sensitivity (alpha) */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-semibold text-[#171719]">Anomaly Sensitivity (EWMA α)</label>
                <span className="font-mono text-[#64748B] font-bold">{ewmaAlpha.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={ewmaAlpha}
                onChange={(e) => setEwmaAlpha(Number(e.target.value))}
                className="w-full accent-[#171719] bg-neutral-100 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-[#64748B] leading-normal">
                Lower weight tracks historical base mean closely. Higher weight prioritizes sudden spikes in latency.
              </p>
            </div>

            {/* Drift evaluation batch size */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="font-semibold text-[#171719]">Drift Cosine Matrix size</label>
                <span className="font-mono text-[#64748B] font-bold">{driftBatchSize} traces</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={driftBatchSize}
                onChange={(e) => setDriftBatchSize(Number(e.target.value))}
                className="w-full accent-[#171719] bg-neutral-100 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Scrub PII fields */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/50 bg-[#F5F5F0]/50">
              <div className="space-y-0.5">
                <label className="font-semibold text-[#171719] block">PII Sanitization</label>
                <span className="text-[10px] text-[#64748B]">Scrub sensitive client metadata on host</span>
              </div>
              <button
                onClick={() => setPiiScrubbing(!piiScrubbing)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                  piiScrubbing ? "bg-[#171719]" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                    piiScrubbing ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Apply Configuration button */}
            <div className="pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl bg-white border border-neutral-200/70 hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Config...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Settings Saved!</span>
                  </>
                ) : (
                  <span>Apply Telemetry Settings</span>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
