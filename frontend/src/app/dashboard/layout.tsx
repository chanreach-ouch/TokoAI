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
    // Verify session
    api.get('/auth/me').catch(() => {
      logout();
    });
  }, [logout]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#0F172A] font-sans flex flex-col md:flex-row selection:bg-[#EA580C]/20 selection:text-[#EA580C]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Unified Topbar */}
        <Topbar />

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile 1-Tap Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
