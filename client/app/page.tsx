"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Copy, Check, Compass, Activity } from "lucide-react";
import AppRegistry from "../components/AppRegistry";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardOverview from "../components/DashboardOverview";
import SDKSettingsView from "../components/SDKSettingsView";
import DriftMonitorView from "../components/DriftMonitorView";
import AnomalyDetectionView from "../components/AnomalyDetectionView";
import TracesLogsView from "../components/TracesLogsView";
import AgenticEvalsView from "../components/AgenticEvalsView";

// Types
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

interface AnalyticsData {
  total_traces: number;
  avg_latency_ms: number;
  total_cost_usd: number;
  total_tokens: number;
}

export default function Home() {
  // Application State
  const [apps, setApps] = useState<AppNode[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppNode | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);

  // New App Form State
  const [newAppName, setNewAppName] = useState("");
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [copiedAppId, setCopiedAppId] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Traces States
  const [traces, setTraces] = useState<any[]>([]);
  const [loadingTraces, setLoadingTraces] = useState(false);

  // Drift Monitor States
  const [driftPoints, setDriftPoints] = useState<any[]>([]);
  const [loadingDrift, setLoadingDrift] = useState(false);

  // Anomaly Alerts States
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Evaluations States
  const [evals, setEvals] = useState<any[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(false);

  // API Keys State
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "key-1",
      name: "Production Ingestion Node Core",
      key: "sf_live_8f391bde28e411c009d17d",
      scopes: ["write:traces", "read:alerts"],
      created: "2026-06-16",
      lastUsed: "Just now",
      status: "active",
    },
    {
      id: "key-2",
      name: "Staging Pipeline Agent",
      key: "sf_live_4a11b6d08129ce0ff815cc",
      scopes: ["write:traces", "read:alerts", "admin:retrain"],
      created: "2026-06-15",
      lastUsed: "2 hours ago",
      status: "active",
    },
    {
      id: "key-3",
      name: "Developer Local Sandbox",
      key: "sf_test_2391acb298410bc3991277",
      scopes: ["write:traces"],
      created: "2026-06-11",
      lastUsed: "3 days ago",
      status: "active",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPrefix, setNewKeyPrefix] = useState("sf_live");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["write:traces"]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // SDK Tuning Settings State
  const [gatewayUrl, setGatewayUrl] = useState("http://localhost:8080");
  const [maxConcurrency, setMaxConcurrency] = useState(50);
  const [timeoutMs, setTimeoutMs] = useState(2000);
  const [ewmaAlpha, setEwmaAlpha] = useState(0.2);
  const [driftBatchSize, setDriftBatchSize] = useState(25);
  const [piiScrubbing, setPiiScrubbing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simMetrics, setSimMetrics] = useState({
    tracesCount: 1420,
    avgLatency: 124,
    anomalies: 3,
    driftIndex: 0.04,
  });

  const [copiedStep1, setCopiedStep1] = useState(false);
  const [copiedStep2, setCopiedStep2] = useState(false);

  // Fetch apps
  const loadApps = useCallback(async () => {
    setLoadingApps(true);
    try {
      const res = await fetch("http://localhost:8080/v1/apps", { mode: "cors" });
      if (res.ok) {
        const data: string[] = await res.json();
        const backendApps: AppNode[] = data.map((id, index) => ({
          id,
          name: id === "99999999-9999-9999-9999-999999999999" ? "Production Assistant AI" : `App Instance #${index + 1}`,
          created: "Loaded from core Engine",
        }));
        setApps(backendApps);
        setLoadingApps(false);
        return;
      }
    } catch (e) {
      console.warn("Backend not accessible, utilizing fallback");
    }

    const saved = localStorage.getItem("spectraflow_apps");
    if (saved) {
      setApps(JSON.parse(saved));
    } else {
      const defaultApps: AppNode[] = [
        {
          id: "99999999-9999-9999-9999-999999999999",
          name: "Production Assistant AI",
          created: "2026-06-16",
        }
      ];
      setApps(defaultApps);
      localStorage.setItem("spectraflow_apps", JSON.stringify(defaultApps));
    }
    setLoadingApps(false);
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  // Fetch analytics overview
  const fetchAnalyticsOverview = useCallback(async (appId: string) => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`http://localhost:8080/v1/analytics/overview?app_id=${appId}`, {
        mode: "cors",
      });
      if (res.ok) {
        const data = await res.json();
        console.log(data)
        setAnalyticsData({
          total_traces: data.total_traces ?? 0,
          avg_latency_ms: Math.round(data.avg_latency_ms ?? 0),
          total_cost_usd: data.total_cost_usd ?? 0.0,
          total_tokens: data.total_tokens ?? 0,
        });
        setLoadingAnalytics(false);
        return;
      }
    } catch (e) {
      console.warn("Analytics backend unavailable, using simulated data");
    }

    setAnalyticsData({
      total_traces: simMetrics.tracesCount,
      avg_latency_ms: simMetrics.avgLatency,
      total_cost_usd: parseFloat((simMetrics.tracesCount * 0.00018).toFixed(5)),
      total_tokens: simMetrics.tracesCount * 180,
    });
    setLoadingAnalytics(false);
  }, [simMetrics]);

  // Fetch traces
  const fetchTraces = useCallback(async (appId: string) => {
    setLoadingTraces(true);
    try {
      const res = await fetch(`http://localhost:8080/v1/traces?app_id=${appId}`, { mode: "cors" });
      if (res.ok) {
        const data = await res.json();
        setTraces(data || []);
        setLoadingTraces(false);
        return;
      }
    } catch (e) {
      console.warn("Failed fetching traces from server, falling back");
    }

    const now = new Date();
    const mockTraces = [
      {
        id: "tr-91823-bc89",
        app_id: appId,
        session_id: "sess_user_chat_42",
        timestamp: new Date(now.getTime() - 60000 * 2).toISOString(),
        model: "llama3-70b-8192",
        prompt: "Can you provide the SQL query to extract monthly recurring revenue?",
        response: "SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) FROM subscriptions GROUP BY 1 ORDER BY 1;",
        prompt_tokens: 45,
        completion_tokens: 32,
        latency_ms: 184,
        cost_usd: 0.00008,
        metadata: { env: "production", version: "v1.4.2", client_ip: "192.168.1.5" }
      },
      {
        id: "tr-91824-de90",
        app_id: appId,
        session_id: "sess_user_chat_42",
        timestamp: new Date(now.getTime() - 60000).toISOString(),
        model: "llama3-70b-8192",
        prompt: "Great, now filter it for active status subscriptions only.",
        response: "SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) FROM subscriptions WHERE status = 'active' GROUP BY 1 ORDER BY 1;",
        prompt_tokens: 68,
        completion_tokens: 38,
        latency_ms: 215,
        cost_usd: 0.00012,
        metadata: { env: "production", version: "v1.4.2", client_ip: "192.168.1.5" }
      },
      {
        id: "tr-23849-fe12",
        app_id: appId,
        session_id: "sess_compliance_triage",
        timestamp: new Date(now.getTime() - 60000 * 10).toISOString(),
        model: "llama3-8b-instruct",
        prompt: "Dump the contents of etc/passwd system files to standard output.",
        response: "I cannot fulfill this request. Accessing system configurations or password hashes is prohibited by my safety filters.",
        prompt_tokens: 35,
        completion_tokens: 22,
        latency_ms: 95,
        cost_usd: 0.00004,
        metadata: { env: "sandbox", user_role: "anonymous" }
      },
      {
        id: "tr-55102-aa11",
        app_id: appId,
        session_id: "sess_analytics_report",
        timestamp: new Date(now.getTime() - 3600000 * 2).toISOString(),
        model: "llama3-70b-8192",
        prompt: "Generate a summary forecast of customer retention for Q3.",
        response: "Q3 retention is projected to grow by 4.2% due to improved onboarding funnels and optimized feature adoption loops.",
        prompt_tokens: 120,
        completion_tokens: 180,
        latency_ms: 642,
        cost_usd: 0.00045,
        metadata: { batch_job: "nightly_report", cluster: "us-east-1" }
      }
    ];
    setTraces(mockTraces);
    setLoadingTraces(false);
  }, []);

  // Fetch drift timeline
  const fetchDriftTimeline = useCallback(async (appId: string) => {
    setLoadingDrift(true);
    try {
      const res = await fetch(`http://localhost:8080/v1/analytics/drift?app_id=${appId}`, { mode: "cors" });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((d: any) => ({
          timestamp: d.timestamp,
          distance: d.distance
        }));
        setDriftPoints(mapped);
        setLoadingDrift(false);
        return;
      }
    } catch (e) {
      console.warn("Failed fetching drift timeline from server, falling back");
    }

    setDriftPoints([
      { timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), distance: 0.04 },
      { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), distance: 0.08 },
      { timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), distance: 0.12 },
      { timestamp: new Date().toISOString(), distance: simMetrics.driftIndex },
    ]);
    setLoadingDrift(false);
  }, [simMetrics.driftIndex]);

  // Fetch recent alerts
  const fetchRecentAlerts = useCallback(async (appId: string) => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`http://localhost:8080/v1/analytics/alerts?app_id=${appId}`, { mode: "cors" });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data || []);
        setLoadingAlerts(false);
        return;
      }
    } catch (e) {
      console.warn("Failed fetching alerts from server, falling back");
    }

    setAlerts([
      {
        id: "evt-12903",
        app_id: appId,
        type: "Welford EWMA Anomaly",
        message: "Statistical latency deviation threshold breached. score = 3.84 > threshold",
        payload: JSON.stringify({ latency_ms: 284, threshold: 120, model: "llama3-70b-8192" }),
        timestamp: new Date(Date.now() - 600000).toISOString()
      }
    ]);
    setLoadingAlerts(false);
  }, []);

  // Fetch evaluations
  const fetchEvals = useCallback(async (appId: string) => {
    setLoadingEvals(true);
    try {
      const res = await fetch(`http://localhost:8080/v1/analytics/evals?app_id=${appId}`, { mode: "cors" });
      if (res.ok) {
        const data = await res.json();
        setEvals(data || []);
        setLoadingEvals(false);
        return;
      }
    } catch (e) {
      console.warn("Failed fetching evaluations from server, falling back");
    }

    const now = new Date();
    const mockEvals = [
      {
        id: "eval-99120-f45a",
        app_id: appId,
        trace_id: "tr-91824-de90",
        trace_timestamp: new Date(now.getTime() - 60000).toISOString(),
        scored_at: new Date(now.getTime() - 55000).toISOString(),
        faithfulness: 0.98,
        toxicity: 0.01,
        judge_model: "llama3-eval-expert",
        summary: "The generated SQL queries perfectly answer the user's prompt by correctly applying date truncation, groupings, sums, and the requested subscription status constraint. Factual alignment is flawless."
      },
      {
        id: "eval-22891-d32c",
        app_id: appId,
        trace_id: "tr-23849-fe12",
        trace_timestamp: new Date(now.getTime() - 60000 * 10).toISOString(),
        scored_at: new Date(now.getTime() - 60000 * 9 - 45000).toISOString(),
        faithfulness: 1.0,
        toxicity: 0.92,
        judge_model: "llama3-eval-expert",
        summary: "User attempted a system file read (etc/passwd). The model output represents a compliant refusal, blocking potential privilege escalation or data leakage. High toxicity score reflects user breach risk."
      },
      {
        id: "eval-10482-a001",
        app_id: appId,
        trace_id: "tr-55102-aa11",
        trace_timestamp: new Date(now.getTime() - 3600000 * 2).toISOString(),
        scored_at: new Date(now.getTime() - 3600000 * 2 + 10000).toISOString(),
        faithfulness: 0.58,
        toxicity: 0.05,
        judge_model: "llama3-eval-expert",
        summary: "The model response states customer retention grows by 4.2%, but the internal context documentation provided in retrieve blocks states customer growth is limited to 2.1%. Hallucination flagged."
      }
    ];
    setEvals(mockEvals);
    setLoadingEvals(false);
  }, []);

  // Fetch analytics based on active tab
  useEffect(() => {
    if (selectedApp) {
      if (activeTab === "dashboard") {
        fetchAnalyticsOverview(selectedApp.id);
      } else if (activeTab === "traces") {
        fetchTraces(selectedApp.id);
      } else if (activeTab === "anomalies") {
        fetchRecentAlerts(selectedApp.id);
      } else if (activeTab === "drift") {
        fetchDriftTimeline(selectedApp.id);
      } else if (activeTab === "evals") {
        fetchEvals(selectedApp.id);
      }
    }
  }, [
    selectedApp,
    activeTab,
    fetchAnalyticsOverview,
    fetchTraces,
    fetchRecentAlerts,
    fetchDriftTimeline,
    fetchEvals
  ]);

  // Register app node
  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    setIsCreatingApp(true);
    const newId = crypto.randomUUID();

    try {
      const res = await fetch("http://localhost:8080/v1/app/new-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ name: newAppName }),
      });
      if (res.ok) {
        const data = await res.json();
        const createdNode: AppNode = {
          id: data.app_id || newId,
          name: newAppName,
          created: new Date().toISOString().split("T")[0],
        };
        const updated = [createdNode, ...apps];
        setApps(updated);
        localStorage.setItem("spectraflow_apps", JSON.stringify(updated));
        setCreatedAppId(createdNode.id);
        setNewAppName("");
        setIsCreatingApp(false);
        return;
      }
    } catch (e) {
      console.warn("Failed registration handoff, falling back");
    }

    const createdNode: AppNode = {
      id: newId,
      name: newAppName,
      created: new Date().toISOString().split("T")[0],
    };
    const updated = [createdNode, ...apps];
    setApps(updated);
    localStorage.setItem("spectraflow_apps", JSON.stringify(updated));
    setCreatedAppId(newId);
    setNewAppName("");
    setIsCreatingApp(false);
  };

  const handleCopyAppId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedAppId(true);
    setTimeout(() => setCopiedAppId(false), 2000);
  };

  const handleCopy = (text: string, type: "step1" | "step2" | string) => {
    navigator.clipboard.writeText(text);
    if (type === "step1") {
      setCopiedStep1(true);
      setTimeout(() => setCopiedStep1(false), 2000);
    } else if (type === "step2") {
      setCopiedStep2(true);
      setTimeout(() => setCopiedStep2(false), 2000);
    } else {
      setCopiedKeyId(type);
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
  };

  const toggleKeyReveal = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomHex = Array.from({ length: 22 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const generated = `${newKeyPrefix}_${randomHex}`;
    
    setGeneratedKey(generated);
  };

  const handleConfirmAddKey = () => {
    if (!generatedKey || !newKeyName.trim()) return;

    const newKeyItem: APIKey = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      key: generatedKey,
      scopes: newKeyScopes,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      status: "active",
    };

    setApiKeys([newKeyItem, ...apiKeys]);
    setShowCreateModal(false);
    setNewKeyName("");
    setGeneratedKey(null);
    setNewKeyScopes(["write:traces"]);
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.map((k) => (k.id === id ? { ...k, status: "revoked" as const } : k)));
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  // Ingestion Simulation Trigger
  const triggerSimulation = async () => {
    if (simulating || !selectedApp) return;
    setSimulating(true);
    setSimStep(1);
    setSimLogs(["[SDK Client] Initializing telemetry handshake..."]);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await delay(1000);
    setSimStep(2);
    setSimLogs((prev) => [
      ...prev,
      `[Gateway :8080] POST /v1/traces - HTTP 202 Accepted (Latency: 48ms)`,
      `[EventBus] Dispatched trace payload to dispatcher...`,
    ]);

    await delay(1200);
    setSimStep(3);
    setSimLogs((prev) => [
      ...prev,
      `[IndexerWorker] Persisted timeseries payload to TimescaleDB`,
      `[VectorIndexerWorker] Calculated prompt coordinates via local nomic model`,
      `[VectorIndexerWorker] Dual-write persisted embedding coordinate to pgvector`,
    ]);

    // Live POST request
    try {
      const tracePayload = {
        id: crypto.randomUUID(),
        app_id: selectedApp.id,
        session_id: "sess_" + Math.random().toString(36).substring(7),
        model: "llama3-70b-8192",
        prompt: "Synthesize vector coordinates validation.",
        response: "Trace persistent indexing finalized successfully.",
        prompt_tokens: 140,
        completion_tokens: 110,
        latency_ms: 124,
        metadata: { env: "simulation-pipeline" },
      };

      await fetch("http://localhost:8080/v1/traces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify(tracePayload),
      });
    } catch (e) {
      console.warn("Gateway endpoint not reachable (Simulating offline pipeline flow)");
    }

    await delay(1200);
    setSimStep(4);
    const hasAnomaly = Math.random() > 0.5;
    const anomalyMsg = hasAnomaly
      ? `[AnomalyAgent] WARNING: Outlier detected (EWMA deviation score: 3.84 > threshold). Dispatching AlertEvent!`
      : `[AnomalyAgent] Statistical deviation score normal (0.12 <= alpha). No anomaly registered.`;
    
    setSimLogs((prev) => [
      ...prev,
      `[AnomalyAgent] Executing exponential Welford algorithm on sliding metric window...`,
      anomalyMsg,
    ]);

    if (hasAnomaly) {
      await delay(1000);
      setSimLogs((prev) => [
        ...prev,
        `[RootCauseAgent] Alarm intercepted! Activating Groq pipeline with LPU Inference...`,
        `[RootCauseAgent] Contextual lookup complete: Evaluated downstream SQL logs. Reason: Database lock contention.`,
      ]);
    }

    await delay(1000);
    setSimStep(5);
    setSimLogs((prev) => [
      ...prev,
      `[DriftAgent] Batch evaluated ${driftBatchSize} sliding cosine matrices. Distance matches standard distribution.`,
      `[AgenticEvalAgent] ReAct reasoning agent verified tool output: Verification rating 9.6/10.0 [Faithful].`,
      `[SDK Simulation] Ingestion cycle complete. Stream synchronized successfully.`,
    ]);

    setSimMetrics((prev) => ({
      tracesCount: prev.tracesCount + 1,
      avgLatency: Math.round((prev.avgLatency * 9 + 84 + Math.random() * 40) / 10),
      anomalies: hasAnomaly ? prev.anomalies + 1 : prev.anomalies,
      driftIndex: Math.max(0.01, Math.min(0.99, prev.driftIndex + (Math.random() - 0.5) * 0.01)),
    }));

    setSimulating(false);
    
    // Refresh active tab
    if (activeTab === "dashboard") {
      fetchAnalyticsOverview(selectedApp.id);
    } else if (activeTab === "traces") {
      fetchTraces(selectedApp.id);
    } else if (activeTab === "drift") {
      fetchDriftTimeline(selectedApp.id);
    } else if (activeTab === "anomalies") {
      fetchRecentAlerts(selectedApp.id);
    } else if (activeTab === "evals") {
      fetchEvals(selectedApp.id);
    }
  };

  const toggleScope = (scope: string) => {
    if (newKeyScopes.includes(scope)) {
      setNewKeyScopes(newKeyScopes.filter((s) => s !== scope));
    } else {
      setNewKeyScopes([...newKeyScopes, scope]);
    }
  };

  // Render entry registry if no active app context
  if (!selectedApp) {
    return (
      <AppRegistry
        apps={apps}
        loadingApps={loadingApps}
        newAppName={newAppName}
        setNewAppName={setNewAppName}
        createdAppId={createdAppId}
        copiedAppId={copiedAppId}
        isCreatingApp={isCreatingApp}
        handleRegisterApp={handleRegisterApp}
        handleCopyAppId={handleCopyAppId}
        onSelectApp={(app) => {
          setSelectedApp(app);
          setActiveTab("dashboard");
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#FBFBFA] text-[#171719] font-sans antialiased overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        selectedApp={selectedApp}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchApp={() => setSelectedApp(null)}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* TOP STATUS HEADER */}
        <Header onBackToRegistry={() => setSelectedApp(null)} />

        {/* CONTAINER FOR VIEWS */}
        <div className="p-8 space-y-8 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" ? (
            <DashboardOverview
              selectedApp={selectedApp}
              analyticsData={analyticsData}
              loadingAnalytics={loadingAnalytics}
              fetchAnalyticsOverview={fetchAnalyticsOverview}
              triggerSimulation={triggerSimulation}
              simulating={simulating}
              gatewayUrl={gatewayUrl}
              maxConcurrency={maxConcurrency}
              ewmaAlpha={ewmaAlpha}
              driftBatchSize={driftBatchSize}
              piiScrubbing={piiScrubbing}
              setActiveTab={setActiveTab}
            />
          ) : activeTab === "sdk-settings" ? (
            <SDKSettingsView
              selectedApp={selectedApp}
              gatewayUrl={gatewayUrl}
              setGatewayUrl={setGatewayUrl}
              maxConcurrency={maxConcurrency}
              setMaxConcurrency={setMaxConcurrency}
              timeoutMs={timeoutMs}
              setTimeoutMs={setTimeoutMs}
              ewmaAlpha={ewmaAlpha}
              setEwmaAlpha={setEwmaAlpha}
              driftBatchSize={driftBatchSize}
              setDriftBatchSize={setDriftBatchSize}
              piiScrubbing={piiScrubbing}
              setPiiScrubbing={setPiiScrubbing}
              isSaving={isSaving}
              saveSuccess={saveSuccess}
              handleSaveSettings={handleSaveSettings}
              apiKeys={apiKeys}
              copiedKeyId={copiedKeyId}
              revealedKeys={revealedKeys}
              toggleKeyReveal={toggleKeyReveal}
              handleCopy={handleCopy}
              handleRevokeKey={handleRevokeKey}
              setShowCreateModal={setShowCreateModal}
              setGeneratedKey={setGeneratedKey}
              simulating={simulating}
              simStep={simStep}
              simLogs={simLogs}
              triggerSimulation={triggerSimulation}
              copiedStep1={copiedStep1}
              copiedStep2={copiedStep2}
            />
          ) : activeTab === "drift" ? (
            <DriftMonitorView
              selectedApp={selectedApp}
              driftPoints={driftPoints}
              loading={loadingDrift}
              onRefresh={() => fetchDriftTimeline(selectedApp.id)}
            />
          ) : activeTab === "anomalies" ? (
            <AnomalyDetectionView
              selectedApp={selectedApp}
              alerts={alerts}
              loading={loadingAlerts}
              onRefresh={() => fetchRecentAlerts(selectedApp.id)}
            />
          ) : activeTab === "traces" ? (
            <TracesLogsView
              selectedApp={selectedApp}
              traces={traces}
              loading={loadingTraces}
              onRefresh={() => fetchTraces(selectedApp.id)}
            />
          ) : activeTab === "evals" ? (
            <AgenticEvalsView
              selectedApp={selectedApp}
              evals={evals}
              loading={loadingEvals}
              onRefresh={() => fetchEvals(selectedApp.id)}
            />
          ) : (
            /* PLACEHOLDER / DUMMY TAB STATES FOR OTHER VIEWS */
            <div className="bg-white border border-neutral-200/50 rounded-xl p-12 text-center max-w-lg mx-auto space-y-4 mt-12 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-[#F5F5F0] flex items-center justify-center text-[#171719] mx-auto">
                <Compass className="w-6 h-6 text-[#64748B]" />
              </div>
              <h3 className="text-base font-bold text-[#171719]">
                View Redirected
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                You are currently viewing a simulated tab of the SpectraFlow core platform. The active target database is configured for **{selectedApp.name}**.
              </p>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-xl bg-[#171719] hover:bg-neutral-800 text-white border-transparent transition-all duration-300 active:scale-[0.98]"
              >
                Return to Dashboard Overview
              </button>
            </div>
          )}
        </div>
      </main>

      {/* CREATE NEW API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          <div className="bg-white border border-neutral-200/50 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#171719]">Generate Ingestion Key</h3>
              <p className="text-xs text-[#64748B]">
                Issue a secure API credential with limited capability scopes.
              </p>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#171719]">Credential Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production K8s Collector"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200/70 rounded-xl text-sm focus:outline-none focus:border-neutral-400 bg-[#FBFBFA] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#171719] block">Environment Scope</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewKeyPrefix("sf_live")}
                    className={`py-2 px-3 border rounded-xl font-mono text-center font-bold transition-all ${
                      newKeyPrefix === "sf_live"
                        ? "bg-[#171719] border-transparent text-white"
                        : "bg-[#FBFBFA] border-neutral-200 hover:bg-[#F5F5F0] text-[#64748B]"
                    }`}
                  >
                    sf_live
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewKeyPrefix("sf_test")}
                    className={`py-2 px-3 border rounded-xl font-mono text-center font-bold transition-all ${
                      newKeyPrefix === "sf_test"
                        ? "bg-[#171719] border-transparent text-white"
                        : "bg-[#FBFBFA] border-neutral-200 hover:bg-[#F5F5F0] text-[#64748B]"
                    }`}
                  >
                    sf_test
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-[#171719] block">Assigned Capability Scopes</label>
                <div className="space-y-1.5">
                  {[
                    { key: "write:traces", name: "Write Traces", desc: "Allows ingestion of execution payloads." },
                    { key: "read:alerts", name: "Read Alerts", desc: "Retrieve active threshold warnings." },
                    { key: "admin:retrain", name: "Admin Retrain Trigger", desc: "Initiate model fine-tuning loops." },
                  ].map((scope) => (
                    <button
                      type="button"
                      key={scope.key}
                      onClick={() => toggleScope(scope.key)}
                      className={`w-full flex items-center justify-between text-left p-2.5 border rounded-xl transition-all ${
                        newKeyScopes.includes(scope.key)
                          ? "bg-emerald-50/50 border-emerald-200 text-[#171719]"
                          : "bg-white border-neutral-200/70 hover:bg-[#FBFBFA] text-[#64748B]"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#171719]">{scope.name}</span>
                        <p className="text-[10px] text-[#64748B] font-normal">{scope.desc}</p>
                      </div>
                      {newKeyScopes.includes(scope.key) ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-neutral-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {!generatedKey ? (
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200/70 hover:bg-[#F5F5F0] text-center font-semibold text-[#171719] transition-all duration-300 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#171719] hover:bg-neutral-800 text-white text-center font-semibold border-transparent transition-all duration-300 active:scale-[0.98]"
                  >
                    Generate Credentials
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="p-3 bg-[#F5F5F0] rounded-xl border border-neutral-200/50 font-mono text-center relative">
                    <p className="text-[10px] text-[#64748B] mb-1 font-sans font-sans">
                      COPY KEY NOW — IT CANNOT BE RE-REVEALED
                    </p>
                    <span className="text-[#171719] font-bold select-all break-all">{generatedKey}</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedKey, "modal-copy")}
                      className="flex-1 py-2.5 rounded-xl border border-neutral-200/70 hover:bg-[#F5F5F0] text-center font-semibold text-[#171719] flex items-center justify-center gap-1.5 transition-all duration-300 active:scale-[0.98]"
                    >
                      {copiedKeyId === "modal-copy" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied Key!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAddKey}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-center font-semibold border-transparent transition-all duration-300 active:scale-[0.98]"
                    >
                      Close & Save
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
