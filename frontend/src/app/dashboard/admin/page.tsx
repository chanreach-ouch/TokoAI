"use client";

import { useState, useEffect } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui/design-system";
import api from "@/lib/api";

export default function AdminPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const res = await api.get('/admin/sellers');
      setTenants(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (sellerId: string) => {
    try {
      await api.post(`/admin/sellers/${sellerId}/toggle-status`);
      fetchSellers();
    } catch (error) {
      console.error(error);
      alert("Failed to toggle seller status.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl pb-12">
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A] flex items-center gap-2">
            <Shield className="text-[#EA580C]" size={24} /> Platform Superadmin Cockpit
          </h1>
          <Badge variant="brand" className="text-[10px]">Multi-Tenant Oversight</Badge>
        </div>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Monitor active Cambodian merchant shops, toggle tenant suspension, and audit bot configurations.
        </p>
      </div>
      
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#EA580C]" />
          Loading platform tenants...
        </div>
      ) : (
        <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-xs rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#FAF9F5] border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Tenant Shop Owner</th>
                  <th className="px-6 py-4">Active Bot Tone</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#0F172A]">{tenant.email}</td>
                    <td className="px-6 py-4 capitalize font-medium text-slate-600">{tenant.bot_tone || 'Friendly'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={tenant.is_active ? 'success' : 'destructive'} className="text-[10px]">
                        {tenant.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant={tenant.is_active ? 'destructive' : 'secondary'} 
                        className="h-7 text-xs px-3"
                        onClick={() => handleToggleStatus(tenant.id)}
                      >
                        {tenant.is_active ? 'Suspend Store' : 'Reactivate Store'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
