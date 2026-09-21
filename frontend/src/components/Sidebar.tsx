"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, MessageSquare, BookOpen, Settings, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const sellerLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Inbox", href: "/dashboard/inbox", icon: MessageSquare },
    { name: "Knowledge Base", href: "/dashboard/knowledge-base", icon: BookOpen },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const adminLinks = [
    { name: "Platform Admin", href: "/dashboard/admin", icon: Users },
  ];

  const links = user?.is_superadmin ? [...sellerLinks, ...adminLinks] : sellerLinks;

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card px-4 py-6">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          T
        </div>
        <span className="text-xl font-bold">TokoAI</span>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link key={link.name} href={link.href}>
              <div
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t pt-4">
        <div className="px-3 py-2 text-xs text-muted-foreground truncate mb-4">
          Logged in as<br />
          <strong className="text-foreground">{user?.email}</strong>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
