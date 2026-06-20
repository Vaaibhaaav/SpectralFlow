"use client";

import React, { useState } from "react";
import { RefreshCw, TrendingUp, HelpCircle, Layers } from "lucide-react";

interface AppNode {
  id: string;
  name: string;
  created: string;
}

interface DriftDataPoint {
  timestamp: string;
  distance: number;
}

interface DriftMonitorProps {
  selectedApp: AppNode;
  driftPoints: DriftDataPoint[];
  loading: boolean;
  onRefresh: () => void;
}

export default function DriftMonitorView({
  selectedApp,
  driftPoints,
  loading,
  onRefresh,
}: DriftMonitorProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DriftDataPoint | null>(null);

  const width = 800;
  const height = 250;
  const paddingX = 50;
  const paddingY = 30;

  // Render SVG path calculations
  const getCoordinates = () => {
    if (driftPoints.length === 0) return { path: "", area: "", points: [] };

    // Find min/max values
    const distances = driftPoints.map((p) => p.distance);
    const maxVal = Math.max(0.25, ...distances, 0.15); // ensure threshold shows
    const minVal = Math.min(0.0, ...distances);

    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const coordinates = driftPoints.map((p, idx) => {
      // spread X coordinates evenly across array index
      const x = paddingX + (idx / Math.max(1, driftPoints.length - 1)) * chartW;
      
      // map distance to y-axis coordinate
      const normalizedY = (p.distance - minVal) / (maxVal - minVal || 1);
      const y = height - paddingY - normalizedY * chartH;
      
      return { x, y, data: p };
    });

    // Generate SVG path string
    let path = "";
    let area = "";

    if (coordinates.length > 0) {
      path = `M ${coordinates[0].x} ${coordinates[0].y}`;
      coordinates.forEach((pt, index) => {
        if (index > 0) {
          path += ` L ${pt.x} ${pt.y}`;
        }
      });

      // Area path for gradient fill
      area = `${path} L ${coordinates[coordinates.length - 1].x} ${height - paddingY} L ${coordinates[0].x} ${height - paddingY} Z`;
    }

    return { path, area, points: coordinates };
  };

  const { path, area, points } = getCoordinates();
  const alertThreshold = 0.15; // default alert threshold as defined in drift check

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-[#171719] leading-tight">
            Semantic Model Drift Analysis
          </h2>
          <p className="text-sm text-[#64748B] max-w-2xl">
            Calculates native pgvector cosine distance configurations matching query embedding deviations for **{selectedApp.name}**.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 rounded-xl bg-white border border-neutral-200/70 hover:bg-[#F5F5F0] text-[#171719] transition-all duration-300 active:scale-[0.98] shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Drift Profile</span>
        </button>
      </div>

      {/* SVG Chart */}
      <div className="bg-white border border-neutral-200/50 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-[#C5A059]" />
            <h3 className="text-sm font-bold text-[#171719] uppercase tracking-tight font-mono">
              Cosine Distance Time-Series Timeline
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#64748B] font-mono">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-indigo-500 inline-block" />
              <span>Cosine Distance</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 border-t border-dashed border-rose-500 inline-block" />
              <span>Drift Alert Bound (0.15)</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#64748B]" />
            <span className="text-xs text-[#64748B] font-mono">Fetching drift metrics...</span>
          </div>
        ) : driftPoints.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 bg-[#FBFBFA] rounded-xl border border-dashed border-neutral-200/80 p-6">
            <Layers className="w-8 h-8 text-[#64748B]" />
            <span className="text-sm font-bold text-[#171719]">Awaiting Drift Timeline Points</span>
            <p className="text-xs text-[#64748B] max-w-sm">
              Model drift calculates cross-product cosine variations. Register new mock trace inputs to build vector records inside pgvector tables.
            </p>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            {/* SVG Plot */}
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none"
              style={{ minWidth: "600px" }}
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={width - paddingX}
                y2={paddingY}
                stroke="#E5E5E0"
                strokeWidth={0.5}
              />
              <line
                x1={paddingX}
                y1={height / 2}
                x2={width - paddingX}
                y2={height / 2}
                stroke="#E5E5E0"
                strokeWidth={0.5}
              />
              <line
                x1={paddingX}
                y1={height - paddingY}
                x2={width - paddingX}
                y2={height - paddingY}
                stroke="#171719"
                strokeWidth={1}
              />

              {/* Y Axis Labels */}
              <text
                x={paddingX - 10}
                y={paddingY + 4}
                className="font-mono text-[9px] fill-[#64748B] text-right"
                textAnchor="end"
              >
                Max Cosine
              </text>
              <text
                x={paddingX - 10}
                y={height - paddingY + 3}
                className="font-mono text-[9px] fill-[#64748B] text-right"
                textAnchor="end"
              >
                0.00
              </text>

              {/* Area Under Curve */}
              {area && <path d={area} fill="url(#chartGrad)" />}

              {/* Threshold line at 0.15 (calculating its mapped Y coordinate) */}
              {(() => {
                const distances = driftPoints.map((p) => p.distance);
                const maxVal = Math.max(0.25, ...distances, 0.15);
                const minVal = Math.min(0.0, ...distances);
                const chartH = height - paddingY * 2;
                const threshY = height - paddingY - ((alertThreshold - minVal) / (maxVal - minVal || 1)) * chartH;
                return (
                  <line
                    x1={paddingX}
                    y1={threshY}
                    x2={width - paddingX}
                    y2={threshY}
                    stroke="#ef4444"
                    strokeDasharray="4 3"
                    strokeWidth={1}
                  />
                );
              })()}

              {/* Main Line path */}
              {path && (
                <path
                  d={path}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interaction Nodes */}
              {points.map((pt, index) => {
                const isHovered = hoveredPoint?.timestamp === pt.data.timestamp;
                const dateLabel = new Date(pt.data.timestamp).toLocaleTimeString();
                return (
                  <g
                    key={index}
                    onMouseEnter={() => setHoveredPoint(pt.data)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill={pt.data.distance > alertThreshold ? "#ef4444" : "#4f46e5"}
                      stroke="#white"
                      strokeWidth={1.5}
                      className="transition-all duration-200"
                    />
                    {isHovered && (
                      <g>
                        {/* Tooltip Background */}
                        <rect
                          x={pt.x - 55}
                          y={pt.y - 45}
                          width={110}
                          height={35}
                          rx={6}
                          fill="#171719"
                          className="opacity-95"
                        />
                        {/* Tooltip Text */}
                        <text
                          x={pt.x}
                          y={pt.y - 32}
                          fill="#white"
                          className="font-mono text-[9px] font-bold text-center"
                          textAnchor="middle"
                        >
                          Dist: {pt.data.distance.toFixed(4)}
                        </text>
                        <text
                          x={pt.x}
                          y={pt.y - 20}
                          fill="#A1A1AA"
                          className="font-mono text-[8px] text-center"
                          textAnchor="middle"
                        >
                          {dateLabel}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Grid Log */}
      <section className="bg-white border border-neutral-200/50 rounded-2xl p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#171719] uppercase tracking-tight font-mono">
            Cosine Distance Volatility Log
          </h3>
          <p className="text-xs text-[#64748B]">
            Tabular coordinate values stored inside prompt_embeddings vector cache index.
          </p>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200/50 text-[10px] tracking-wider uppercase font-mono text-[#64748B]">
                <th className="pb-3 font-semibold">Verification Timestamp</th>
                <th className="pb-3 font-semibold">Semantic Cosine Distance</th>
                <th className="pb-3 font-semibold">Alert Trigger Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/30 font-mono">
              {driftPoints.map((pt, idx) => {
                const isAlert = pt.distance > alertThreshold;
                return (
                  <tr key={idx} className="hover:bg-[#FBFBFA]/60 transition-colors">
                    <td className="py-3 text-[#171719]">
                      {new Date(pt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 text-[#64748B]">
                      {pt.distance.toFixed(6)}
                    </td>
                    <td className="py-3">
                      {isAlert ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 border border-rose-100 text-rose-700">
                          ALERT BREACH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700">
                          NORMAL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
