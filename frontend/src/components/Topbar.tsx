"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Bot, AlertTriangle, ChevronRight, Zap } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function Topbar() {
  const [isAiActive, setIsAiActive] = useState(true);
  const [urgentCount, setUrgentCount] = useState(0);
  const pathname = usePathname();
  const { user } = useAuth();

  // Generate dynamic breadcrumb from pathname
  const getBreadcrumb = () => {
    const currentPath = pathname || "";
    if (currentPath === '/dashboard') return { section: 'Application', page: 'Dashboard' };
    if (currentPath.includes('/inbox')) return { section: 'Commerce', page: 'Live Inbox' };
    if (currentPath.includes('/knowledge-base')) return { section: 'Catalog', page: 'Product & Rules' };
    if (currentPath.includes('/orders')) return { section: 'Fulfillment', page: 'Orders & Dispatch' };
    if (currentPath.includes('/payments')) return { section: 'Finance', page: 'Bakong KHQR' };
    if (currentPath.includes('/customers')) return { section: 'CRM', page: 'Customer Directory' };
    if (currentPath.includes('/ai-setup')) return { section: 'Engine', page: 'AI Playground' };
    if (currentPath.includes('/analytics')) return { section: 'Metrics', page: 'Deep Analytics' };
    if (currentPath.includes('/settings')) return { section: 'Store', page: 'Settings & Tone' };
    if (currentPath.includes('/integrations')) return { section: 'Connect', page: 'Channels' };
    return { section: 'Application', page: 'Cockpit' };
  };

  const breadcrumb = getBreadcrumb();

  useEffect(() => {
    checkEscalations();
    const interval = setInterval(checkEscalations, 6000);
    return () => clearInterval(interval);
  }, []);

  const checkEscalations = async () => {
    try {
      const res = await api.get('/seller/inbox');
      const convs = res.data || [];
      const escalated = convs.filter((c: any) => c.is_human_takeover);
      setUrgentCount(escalated.length);
    } catch (e) {
      // Non-blocking
    }
  };

  const handleToggleAi = async () => {
    const nextState = !isAiActive;
    setIsAiActive(nextState);
    try {
      await api.post('/seller/settings', { is_active: nextState });
    } catch (e) {
      setIsAiActive(!nextState);
    }
  };

  return (
    <header className="h-16 md:h-18 bg-[#F1F5F9] flex items-center justify-between px-6 md:px-8 select-none">
      
      {/* Left: Breadcrumbs matching Rubick Reference ("Application > Dashboard") */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium hover:text-slate-600 transition-colors">
          {breadcrumb.section}
        </span>
        <ChevronRight size={13} className="text-slate-300" />
        <span className="text-[#0F172A] font-bold">
          {breadcrumb.page}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        
        {/* Search Bar matching the Rubick reference */}
        <div className="hidden lg:flex items-center bg-white rounded-full px-4 py-1.5 border border-slate-200/80 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2.5 shrink-0" />
          <input 
            type="text" 
            placeholder="Search orders, chats, products..." 
            className="bg-transparent border-none outline-none text-xs w-full text-slate-900 placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-50 rounded border border-slate-200 shadow-xs">
            ⌘K
          </kbd>
        </div>

        {/* Urgent Human Escalation Badge */}
        {urgentCount > 0 && (
          <Link 
            href="/dashboard/inbox"
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-amber-500/20 transition-all shadow-xs animate-pulse"
          >
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <span className="hidden sm:inline font-extrabold">{urgentCount} Takeover</span>
            <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">
              Reply
            </span>
          </Link>
        )}

        {/* AI Autopilot Live Pill */}
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-3 py-1.5 rounded-full shadow-xs">
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
            onClick={handleToggleAi}
            className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-blue-600 px-1 py-0.5 rounded transition-colors"
          >
            {isAiActive ? "Pause" : "Resume"}
          </button>
        </div>

        {/* Notification Bell */}
        <button 
          className="relative p-2 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          title="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1B38A6] to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-xs ring-2 ring-white">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>

      </div>
    </header>
  );
}
