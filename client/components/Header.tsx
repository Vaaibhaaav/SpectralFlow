"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

interface HeaderProps {
  onBackToRegistry: () => void;
}

export default function Header({ onBackToRegistry }: HeaderProps) {
  return (
    <header className="h-16 border-b border-neutral-200/50 bg-white px-8 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onBackToRegistry}
          className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#171719] border border-neutral-200/50 px-2.5 py-1.5 rounded-xl bg-[#FBFBFA] transition-all duration-300 hover:bg-[#F5F5F0] active:scale-[0.97]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard Registry</span>
        </button>
        <div className="h-4 w-px bg-neutral-200" />
        <h1 className="text-sm font-bold tracking-tight text-[#171719]">
          SpectraFlow // Core Integration Grid
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase font-mono">
            NODE ACCELERATOR ACTIVE
          </span>
        </div>
      </div>
    </header>
  );
}
