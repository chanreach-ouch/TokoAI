"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, MessageSquare, BookOpen, BarChart3, 
  ShoppingBag, Link2, Settings, Users, LogOut, Shield,
  Sparkles, CheckCircle2
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Command Cockpit", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { name: "Unified Inbox", href: "/dashboard/inbox", icon: MessageSquare, badge: "3" },
    { name: "Customer CRM", href: "/dashboard/customers", icon: Users },
    { name: "Knowledge Base", href: "/dashboard/knowledge-base", icon: BookOpen },
    { name: "Orders & Dispatch", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Integrations", href: "/dashboard/integrations", icon: Link2, ownerOnly: true },
    { name: "Deep Analytics", href: "/dashboard/analytics", icon: BarChart3, ownerOnly: true },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, ownerOnly: true },
    { name: "Platform Admin", href: "/dashboard/admin", icon: Shield, adminOnly: true },
  ].filter(item => {
    if (item.adminOnly && !user?.is_superadmin) return false;
    return true;
  });

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white h-screen border-r border-slate-200/80 text-slate-700 shrink-0 select-none">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white font-bold shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles size={16} className="fill-white/20" />
          </div>
          <div>
            <span className="text-base font-extrabold text-[#0F172A] tracking-tight flex items-center gap-1.5">
              TokoAI
              <span className="text-[10px] bg-orange-50 text-[#EA580C] px-1.5 py-0.5 rounded-full font-bold border border-orange-200/80">
                KH 🇰🇭
              </span>
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                  isActive
                    ? "bg-orange-50 text-[#EA580C] border border-orange-200/80 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 font-medium border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#EA580C]' : 'text-slate-400 group-hover:text-slate-700'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#EA580C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: Autonomy Stats & User Card */}
      <div className="p-3.5 border-t border-slate-100 mt-auto space-y-3 bg-[#FAF9F5]">
        
        {/* Token & Autonomy Meter */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#EA580C]" /> AI Autonomy
            </span>
            <span className="text-[#EA580C] font-bold">94% active</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-[1px]">
            <div className="h-full bg-gradient-to-r from-[#EA580C] to-amber-500 w-[94%] rounded-full shadow-xs" />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
            <span>Tokens: 8.2k / 10k</span>
            <Link href="/dashboard/settings" className="text-[#EA580C] hover:underline font-bold">
              Manage
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#0F172A] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
            {user?.email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[#0F172A] truncate">{user?.email || "seller@shop.com"}</div>
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={10} /> Bakong Verified
            </div>
          </div>
          <button 
            onClick={logout} 
            title="Log out" 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
