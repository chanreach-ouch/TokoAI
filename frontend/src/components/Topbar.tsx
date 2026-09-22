"use client";

import { useState } from "react";
import { Search, Bell, Globe } from "lucide-react";

export function Topbar() {
  const [isAiActive, setIsAiActive] = useState(true);
  const [isKhmer, setIsKhmer] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-brand-line flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      
      {/* Search */}
      <div className="flex-1 max-w-md hidden md:flex items-center bg-brand-mist rounded-xl px-4 py-2 border border-brand-line focus-within:border-brand-pink transition-colors">
        <Search className="w-4 h-4 text-brand-muted mr-2" />
        <input 
          type="text" 
          placeholder="Search customers, products, or chats..." 
          className="bg-transparent border-none outline-none text-sm w-full text-brand-ink placeholder:text-brand-muted"
        />
      </div>

      <div className="flex-1 flex justify-end items-center gap-4 md:gap-6">
        {/* Global AI Status Indicator */}
        <div className="flex items-center gap-3 bg-brand-mist border border-brand-line px-3 py-1.5 rounded-full">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isAiActive && <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isAiActive ? 'bg-brand-cyan' : 'bg-brand-pink'}`}></span>
            </span>
            <span className="text-xs font-semibold text-brand-ink hidden md:block">
              {isAiActive ? "AI Active" : "AI Paused"}
            </span>
          </div>
          <div className="w-px h-4 bg-brand-line mx-1 hidden md:block"></div>
          <button 
            onClick={() => setIsAiActive(!isAiActive)}
            className="text-xs font-bold text-brand-muted hover:text-brand-ink transition-colors"
          >
            {isAiActive ? "Pause" : "Resume"}
          </button>
        </div>

        {/* Language Toggle */}
        <button 
          onClick={() => setIsKhmer(!isKhmer)}
          className="flex items-center gap-1 text-sm font-semibold text-brand-muted hover:text-brand-ink transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{isKhmer ? "KH" : "EN"}</span>
        </button>

        {/* Notifications */}
        <button className="relative text-brand-muted hover:text-brand-ink transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-pink rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
}
