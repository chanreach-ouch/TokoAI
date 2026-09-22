"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  MessageSquare, BookOpen, BarChart3, CreditCard, 
  Smile, Settings, Users, LogOut 
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const sellerLinks = [
    { name: "AI Inbox", href: "/dashboard/inbox", icon: MessageSquare, badge: "3" },
    { name: "Knowledge Base", href: "/dashboard/knowledge-base", icon: BookOpen },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { name: "Personality", href: "/dashboard/personality", icon: Smile },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const adminLinks = [
    { name: "Platform Admin", href: "/dashboard/admin", icon: Users },
  ];

  const links = user?.is_superadmin ? [...sellerLinks, ...adminLinks] : sellerLinks;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-brand-ink h-screen border-r border-gray-800 text-gray-300">
      
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white font-bold shadow-glow">T</div>
          <span className="text-xl font-bold text-white tracking-tight">TokoAI</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard');

          return (
            <Link key={link.name} href={link.href}>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-ink-2 text-white border border-gray-700/50 shadow-sm"
                    : "hover:bg-brand-ink-2/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-cyan' : 'text-gray-400'}`} />
                  {link.name}
                </div>
                {link.badge && (
                  <span className="bg-brand-pink text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {link.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: Usage & User Card */}
      <div className="p-4 border-t border-gray-800 mt-auto space-y-4">
        
        {/* Usage Meter */}
        <div className="bg-brand-ink-2 p-4 rounded-2xl border border-gray-800">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="font-semibold text-white">AI Tokens</span>
            <span className="text-gray-400">8.2k / 10k</span>
          </div>
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-primary w-[82%] rounded-full" />
          </div>
          <div className="mt-2 text-[10px] text-brand-cyan hover:underline cursor-pointer">Upgrade Plan</div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 bg-brand-ink-2 p-3 rounded-2xl border border-gray-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-pink to-brand-cyan flex items-center justify-center text-white font-bold text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.email || "seller@shop.com"}</div>
            <div className="text-xs text-gray-400 truncate">Pro Plan</div>
          </div>
          <button onClick={logout} className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
