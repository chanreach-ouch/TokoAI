"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, MessageSquare, BookOpen, BarChart3,
  ShoppingBag, Link2, Settings, Users, LogOut, Shield,
  Sparkles, CheckCircle2, QrCode, Bot
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  exact?: boolean;
  badge?: string;
  adminOnly?: boolean;
  ownerOnly?: boolean;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Core Commerce",
    items: [
      { name: "Command Cockpit",  href: "/dashboard",               icon: LayoutDashboard, exact: true },
      { name: "Live Inbox",       href: "/dashboard/inbox",          icon: MessageSquare,   badge: "3" },
      { name: "Orders & Dispatch",href: "/dashboard/orders",         icon: ShoppingBag },
      { name: "Bakong KHQR Pay",  href: "/dashboard/payments",       icon: QrCode },
    ]
  },
  {
    title: "AI Brain & Intelligence",
    items: [
      { name: "AI Consultant & BI",href: "/dashboard/consultant",     icon: Bot, badge: "NEW" },
      { name: "Knowledge Base",   href: "/dashboard/knowledge-base", icon: BookOpen },
      { name: "Customer CRM",     href: "/dashboard/customers",      icon: Users },
      { name: "AI Simulator",     href: "/dashboard/ai-setup",       icon: Sparkles },
    ]
  },
  {
    title: "Analytics & System",
    items: [
      { name: "Deep Analytics",   href: "/dashboard/analytics",      icon: BarChart3,       ownerOnly: true },
      { name: "Channel Connect",  href: "/dashboard/integrations",   icon: Link2,           ownerOnly: true },
      { name: "Bot Safeguards",   href: "/dashboard/settings",       icon: Settings,        ownerOnly: true },
      { name: "Platform Admin",   href: "/dashboard/admin",          icon: Shield,          adminOnly: true },
    ]
  }
];

const ALL_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const asideRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 44, opacity: 0 });

  const updateIndicator = () => {
    const currentPath = pathname || "";
    const activeItem = ALL_ITEMS.find(item => 
      item.exact 
        ? currentPath === item.href 
        : (currentPath === item.href || (currentPath.startsWith(item.href) && item.href !== '/dashboard'))
    ) || ALL_ITEMS[0];

    if (!activeItem) return;
    const targetEl = itemRefs.current[activeItem.href];
    const asideEl = asideRef.current;
    if (targetEl && asideEl) {
      const targetRect = targetEl.getBoundingClientRect();
      const asideRect = asideEl.getBoundingClientRect();
      const relativeTop = targetRect.top - asideRect.top;
      setIndicatorStyle({
        top: relativeTop,
        height: targetRect.height,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    updateIndicator();
    const timer = setTimeout(updateIndicator, 60);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [pathname]);

  return (
    <aside 
      ref={asideRef}
      className="hidden md:flex flex-col w-64 bg-[#1B38A6] h-screen text-white shrink-0 select-none relative z-30"
    >

      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 relative z-20">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1B38A6] shadow-md group-hover:scale-105 transition-transform duration-200">
            <Bot size={20} className="stroke-[2.5]" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              TokoAI
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold border border-white/20">
                🇰🇭 KH
              </span>
            </div>
            <div className="text-[10px] text-blue-200/80 font-medium">Autonomous Commerce</div>
          </div>
        </Link>
      </div>

      {/* The Single Sliding Active Cutout that physically glides vertically along the sidebar */}
      <div
        className="absolute pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-10"
        style={{
          left: '16px',
          right: '-1px',
          top: 0,
          transform: `translateY(${indicatorStyle.top}px)`,
          height: `${indicatorStyle.height}px`,
          opacity: indicatorStyle.opacity,
        }}
      >
        {/* Active Tab Body flush with the content panel on the right - ZERO SHADOWS, ZERO LINES */}
        <div className="w-full h-full bg-[#F1F5F9] rounded-l-full relative shadow-none border-none">
          {/* Top Inverted Curve - perfectly flush right, 1px integer overlap to eliminate seam */}
          <div className="absolute right-0 -top-[23px] w-[24px] h-[24px] pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M24 0 C24 13.255 13.255 24 0 24 H24 V0 Z" fill="#F1F5F9" />
            </svg>
          </div>
          {/* Bottom Inverted Curve - perfectly flush right, 1px integer overlap to eliminate seam */}
          <div className="absolute right-0 -bottom-[23px] w-[24px] h-[24px] pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M0 0 C13.255 0 24 10.745 24 24 V0 H0 Z" fill="#F1F5F9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-2 space-y-4 relative z-20">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(item => {
            if (item.adminOnly && !user?.is_superadmin) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-7 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-200/50">
                {section.title}
              </div>

              {visibleItems.map((item) => {
                const Icon = item.icon;
                const currentPath = pathname || "";
                const isItemActive = item.exact
                  ? currentPath === item.href
                  : currentPath === item.href || (currentPath.startsWith(item.href) && item.href !== '/dashboard');

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    ref={(el) => { itemRefs.current[item.href] = el; }}
                    className="block relative select-none"
                  >
                    <div
                      className={`flex items-center justify-between text-[12px] h-11 pl-7 pr-4 transition-colors duration-200 ${
                        isItemActive
                          ? "text-[#1B38A6] font-extrabold"
                          : "text-blue-100/80 hover:text-white font-medium hover:translate-x-1 transition-transform"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            isItemActive 
                              ? 'text-[#1B38A6] stroke-[2.5] scale-105' 
                              : 'text-blue-200/70 group-hover:text-white'
                          }`}
                        />
                        <span className="leading-none">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs ${
                          isItemActive 
                            ? "bg-[#EA580C] text-white" 
                            : "bg-white/20 text-white"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom: Frosted Glass Token Meter + User Card */}
      <div className="p-4 space-y-3 bg-blue-950/20 border-t border-white/10 mx-4 mb-3 rounded-2xl relative z-20">
        {/* AI Autonomy Telemetry Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3 pt-2.5 pb-2.5 text-white shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-300" /> AI Autonomy
            </span>
            <span className="text-[10px] font-extrabold text-amber-300">84%</span>
          </div>
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-300 to-emerald-400 w-[84%] rounded-full shadow-xs" />
          </div>
          <div className="flex justify-between items-center text-[9px] text-blue-200/80">
            <span>8,200 / 10,000 msgs</span>
            <Link href="/dashboard/settings" className="text-white font-bold hover:underline">
              Upgrade
            </Link>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-2.5 py-1.5 rounded-xl shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-white text-[#1B38A6] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            {user?.email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-white truncate">{user?.email || "seller@shop.com"}</div>
            <div className="text-[8px] text-emerald-300 font-medium flex items-center gap-0.5">
              <CheckCircle2 size={8} /> Bakong Verified
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1 hover:bg-white/20 rounded-lg text-blue-200 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
