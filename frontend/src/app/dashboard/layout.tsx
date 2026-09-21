"use client";

import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/context/AuthContext"; // Ensure it is wrapped in auth provider if not in layout

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/20">
        {children}
      </main>
    </div>
  );
}
