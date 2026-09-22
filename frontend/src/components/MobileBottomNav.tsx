"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, ShoppingBag, BarChart3, CreditCard, MoreHorizontal } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Inbox", href: "/dashboard/inbox", icon: MessageSquare, badge: true },
    { name: "Shop", href: "/dashboard/knowledge-base", icon: ShoppingBag },
    { name: "Stats", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Pay", href: "/dashboard/payments", icon: CreditCard },
    { name: "More", href: "/dashboard/settings", icon: MoreHorizontal },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-brand-line z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');

        return (
          <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-full h-full relative">
            <div className={`p-1 rounded-xl mb-1 ${isActive ? 'bg-brand-pink/10' : ''}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-brand-pink' : 'text-brand-muted'}`} />
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'text-brand-pink' : 'text-brand-muted'}`}>
              {item.name}
            </span>
            {item.badge && (
              <div className="absolute top-2 right-1/4 w-2 h-2 bg-brand-pink rounded-full border border-white"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
