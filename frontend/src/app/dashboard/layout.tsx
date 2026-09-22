"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, MessageSquare, Database, Settings, 
  User, Bell, ChevronRight, Bot, Link2, ShoppingBag, Shield 
} from "lucide-react";
import { Button } from "@/components/ui/design-system";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { id: '/dashboard/analytics', label: 'Overview', icon: LayoutDashboard },
    { id: '/dashboard/inbox', label: 'AI Inbox', icon: MessageSquare },
    { id: '/dashboard/knowledge-base', label: 'Knowledge Base', icon: Database },
    { id: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
    { id: '/dashboard/integrations', label: 'Integrations', icon: Link2 },
    { id: '/dashboard/settings', label: 'Settings', icon: Settings },
    { id: '/dashboard/admin', label: 'Admin', icon: Shield },
  ];

  const handleLogout = () => {
    localStorage.removeItem("tokoai_token");
    router.push("/login");
  };

  const activeNavItem = navItems.find(item => pathname === item.id) || navItems[0];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 font-sans flex flex-col md:flex-row selection:bg-zinc-800 selection:text-white">
      <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-[#222] bg-black flex flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-[#222]">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/dashboard/analytics')}>
            <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
              <Bot size={16} className="text-black" />
            </div>
            <span className="font-semibold text-sm tracking-wide text-white">TokoAI</span>
          </div>
        </div>
        
        <div className="p-3 flex-1 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.id;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150 ${
                  isActive 
                    ? 'bg-[#111] text-white font-medium' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#111]/50'
                }`}
              >
                <item.icon size={16} className={isActive ? 'text-white' : 'text-zinc-500'} />
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="p-3 border-t border-[#222] mt-auto">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#111] transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center shrink-0">
              <User size={14} className="text-zinc-300" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white">Active Shop</p>
              <p className="text-xs text-zinc-500 truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0A0A0A]">
        <header className="h-14 border-b border-[#222] bg-black flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center text-sm font-medium text-zinc-400">
            <span className="text-zinc-300">Active Shop</span>
            <ChevronRight size={14} className="mx-1 text-zinc-600" />
            <span className="text-white capitalize">{activeNavItem.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-[#111] transition-colors">
              <Bell size={16} />
            </button>
            <div className="h-4 w-[1px] bg-[#333]"></div>
            <Button variant="ghost" className="h-8 text-xs px-3" onClick={handleLogout}>Log out</Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
