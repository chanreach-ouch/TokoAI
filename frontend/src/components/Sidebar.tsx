"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, MessageSquare, BookOpen, BarChart3,
  ShoppingBag, Link2, Settings, Users, LogOut, Shield,
  Sparkles, CheckCircle2, QrCode
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Command Cockpit",  href: "/dashboard",                  icon: LayoutDashboard, exact: true },
    { name: "Unified Inbox",    href: "/dashboard/inbox",             icon: MessageSquare,   badge: "3" },
    { name: "AI Simulator",     href: "/dashboard/ai-setup",          icon: Sparkles },
    { name: "Customer CRM",     href: "/dashboard/customers",         icon: Users },
    { name: "Knowledge Base",   href: "/dashboard/knowledge-base",    icon: BookOpen },
    { name: "Orders & Dispatch",href: "/dashboard/orders",            icon: ShoppingBag },
    { name: "Bakong KHQR",      href: "/dashboard/payments",          icon: QrCode },
    { name: "Integrations",     href: "/dashboard/integrations",      icon: Link2,           ownerOnly: true },
    { name: "Deep Analytics",   href: "/dashboard/analytics",         icon: BarChart3,       ownerOnly: true },
    { name: "Settings",         href: "/dashboard/settings",          icon: Settings,        ownerOnly: true },
    { name: "Platform Admin",   href: "/dashboard/admin",             icon: Shield,          adminOnly: true },
  ].filter(item => {
    if (item.adminOnly && !user?.is_superadmin) return false;
    return true;
  });

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white h-screen border-r border-[#E4E7EF] text-[#0F172A] shrink-0 select-none">

      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-[#F5F2ED]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          {/* Logo mark */}
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles size={15} className="fill-white/20" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold text-[#0F172A] tracking-tight flex items-center gap-1.5">
              TokoAI
              <span className="text-[10px] bg-orange-50 text-[#EA580C] px-1.5 py-0.5 rounded-full font-bold border border-orange-200/80">
                KH
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Merchant Dashboard</div>
          </div>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Navigation</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 ${
                  isActive
                    ? "bg-orange-50 text-[#EA580C] font-bold border-l-2 border-[#EA580C] pl-[10px]"
                    : "text-slate-600 hover:text-[#0F172A] hover:bg-[#FAF9F5] font-medium border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#EA580C]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="leading-none">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#EA580C] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Token Meter + User Card */}
      <div className="p-3 border-t border-[#F5F2ED] space-y-2.5 bg-[#FAF9F5]">

        {/* AI Autonomy Meter */}
        <div className="bg-white border border-[#E4E7EF] rounded-xl px-3 pt-2.5 pb-3 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-[#0F172A] flex items-center gap-1.5">
              <Sparkles size={11} className="text-[#EA580C]" /> AI Autonomy
            </span>
            <span className="text-[11px] font-bold text-[#EA580C]">94%</span>
          </div>
          <div className="h-1.5 w-full bg-[#F5F2ED] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#EA580C] to-[#F97316] w-[94%] rounded-full" />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>8,200 / 10,000 msgs</span>
            <Link href="/dashboard/settings" className="text-[#EA580C] font-bold hover:underline">
              Upgrade
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 bg-white border border-[#E4E7EF] px-2.5 py-2 rounded-xl shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-[#0F172A] flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-[#0F172A] truncate">{user?.email || "seller@shop.com"}</div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={9} /> Bakong Verified
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 hover:bg-[#FAF9F5] rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
