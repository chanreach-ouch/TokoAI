"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
          <Shield className="text-amber-500" /> Superadmin Panel
        </h2>
        <p className="text-sm text-zinc-500 mt-1">Manage tenant shops and system status.</p>
      </div>
      
      {isLoading ? (
        <div className="text-zinc-500 text-sm">Loading tenants...</div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#050505] border-b border-[#222] text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-medium">Tenant Email</th>
                <th className="px-6 py-4 font-medium">Bot Tone</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-[#111] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{tenant.email}</td>
                  <td className="px-6 py-4 text-zinc-400 capitalize">{tenant.bot_tone || 'Friendly'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={tenant.is_active ? 'success' : 'destructive'}>
                      {tenant.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant={tenant.is_active ? 'ghost' : 'secondary'} 
                      className="h-7 text-xs"
                      onClick={() => handleToggleStatus(tenant.id)}
                    >
                      {tenant.is_active ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
