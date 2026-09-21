"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Seller {
  id: string;
  email: string;
  created_at: string;
  is_active: boolean;
  bot_tone: string;
  ai_token_usage: number;
  is_superadmin: boolean;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);

  const fetchSellers = async () => {
    try {
      const res = await api.get("/admin/sellers");
      setSellers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isLoading && !user?.is_superadmin) {
      router.push("/dashboard");
    } else if (user?.is_superadmin) {
      fetchSellers();
    }
  }, [user, isLoading, router]);

  const toggleSuspend = async (id: string, isSuperadmin: boolean) => {
    if (isSuperadmin) {
      alert("You cannot suspend the master admin account!");
      return;
    }
    
    try {
      await api.post(`/admin/sellers/${id}/toggle-suspend`);
      fetchSellers(); // Refresh list
    } catch (err) {
      alert("Failed to toggle suspension status");
    }
  };

  if (isLoading || !user?.is_superadmin) {
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Platform Administration</h1>
      <p className="text-muted-foreground mb-8">
        Manage your SaaS tenants, track AI token usage, and enforce suspensions.
      </p>
      
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase font-semibold text-xs border-b">
            <tr>
              <th className="px-6 py-4">Account / Email</th>
              <th className="px-6 py-4">Joined Date</th>
              <th className="px-6 py-4">AI Usage (Tokens)</th>
              <th className="px-6 py-4">Bot Tone</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sellers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No sellers found.
                </td>
              </tr>
            ) : (
              sellers.map((s) => (
                <tr key={s.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {s.email}
                    {s.is_superadmin && (
                      <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-primary">
                    {s.ai_token_usage.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {s.bot_tone}
                  </td>
                  <td className="px-6 py-4">
                    {s.is_active ? (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant={s.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleSuspend(s.id, s.is_superadmin)}
                      disabled={s.is_superadmin}
                    >
                      {s.is_active ? "Suspend" : "Reactivate"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
