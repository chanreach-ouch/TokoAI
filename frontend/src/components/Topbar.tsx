"use client";

import { useState } from "react";
import { Search, Bell, Globe, Bot, ShieldCheck } from "lucide-react";

export function Topbar() {
  const [isAiActive, setIsAiActive] = useState(true);
  const [isKhmer, setIsKhmer] = useState(false);

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 select-none">
      
      {/* Left: Mobile Brand / Desktop Search */}
      <div className="flex items-center gap-3">
        <div className="flex md:hidden items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white font-bold text-xs shadow-xs">
            T
          </div>
          <span className="font-extrabold text-sm text-[#0F172A]">TokoAI</span>
        </div>

        <div className="hidden md:flex items-center bg-slate-50 rounded-full px-3.5 py-1.5 border border-slate-200/80 focus-within:border-[#EA580C] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#EA580C]/15 transition-all w-80 shadow-2xs">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Search orders, chats, products..." 
            className="bg-transparent border-none outline-none text-xs w-full text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 md:gap-4">
        
        {/* Global AI Autonomous Status */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {isAiActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isAiActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-[11px] font-bold text-slate-800 hidden sm:inline">
              {isAiActive ? "AI Pilot Active" : "AI Paused"}
            </span>
          </div>
          <button 
            onClick={() => setIsAiActive(!isAiActive)}
            className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#EA580C] px-1.5 py-0.5 rounded transition-colors"
          >
            {isAiActive ? "Pause" : "Resume"}
          </button>
        </div>

        {/* Bakong Partner Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold text-[#00938C] bg-teal-50 border border-teal-200/80 px-3 py-1.5 rounded-full shadow-2xs">
          <ShieldCheck size={14} /> Bakong Connected
        </div>

        {/* Language Toggle */}
        <button 
          onClick={() => setIsKhmer(!isKhmer)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full hover:border-slate-300 shadow-2xs transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>{isKhmer ? "KH 🇰🇭" : "EN 🇺🇸"}</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EA580C] rounded-full shadow-xs"></span>
        </button>
      </div>
    </header>
  );
}
