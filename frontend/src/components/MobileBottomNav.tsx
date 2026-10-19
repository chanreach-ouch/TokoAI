"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, ShoppingBag, BookOpen, Settings } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Cockpit", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { name: "Inbox", href: "/dashboard/inbox", icon: MessageSquare, badge: "3" },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Catalog", href: "/dashboard/knowledge-base", icon: BookOpen },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');

        return (
          <Link 
            key={item.name} 
            href={item.href} 
            className="flex flex-col items-center justify-center w-full h-full relative py-1"
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-orange-50 text-[#EA580C]' : 'text-slate-400'}`}>
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#EA580C]' : 'text-slate-400'}`} />
            </div>
            <span className={`text-[10px] transition-colors mt-0.5 ${isActive ? 'text-[#0F172A] font-bold' : 'text-slate-400 font-medium'}`}>
              {item.name}
            </span>
            {item.badge && (
              <span className="absolute top-1.5 right-[28%] w-2 h-2 bg-[#EA580C] rounded-full shadow-sm"></span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
