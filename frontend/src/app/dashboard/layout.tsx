"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    // Verify active merchant session
    api.get('/auth/me').catch(() => {
      logout();
    });
  }, [logout]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1B38A6] text-[#0F172A] font-sans flex flex-col md:flex-row selection:bg-blue-600/20 selection:text-blue-700">
      {/* Desktop Royal Cobalt Navigation Shell — FIXED & PINNED, NEVER SCROLLS */}
      <Sidebar />

      {/* Main Content Area — ONLY THIS PANEL SCROLLS */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F1F5F9]">
        {/* Sticky Topbar pinned at top of content area */}
        <div className="sticky top-0 z-20 shrink-0 bg-[#F1F5F9]">
          <Topbar />
        </div>

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile 1-Tap Bottom Navigation for Cambodian Merchants */}
      <MobileBottomNav />
    </div>
  );
}
