"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge } from "@/components/ui/design-system";
import api from "@/lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const fetchOrders = async (pageIndex: number) => {
    setIsLoading(true);
    try {
      const skip = pageIndex * limit;
      const res = await api.get(`/orders?skip=${skip}&limit=${limit}`);
      setOrders(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    if (status === 'PAID') return 'success';
    if (status === 'CANCELLED') return 'destructive';
    return 'warning';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Bakong Orders</h2>
        <Button variant="secondary" className="h-8" onClick={() => fetchOrders(page)}>Refresh Data</Button>
      </div>
      
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#050505] border-b border-[#222] text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Customer ID</th>
              <th className="px-6 py-4 font-medium">Amount (KHR)</th>
              <th className="px-6 py-4 font-medium">Amount (USD)</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  No orders found. When customers pay via Bakong KHQR, they will appear here.
                </td>
              </tr>
            ) : (
              orders.map(order => {
                const khrAmount = (order.total_amount_usd * 4000).toLocaleString();
                const usdAmount = Number(order.total_amount_usd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                
                return (
                  <tr key={order.id} className="hover:bg-[#111] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">ORD-{order.id.toString().padStart(3, '0')}</td>
                    <td className="px-6 py-4 text-zinc-400 tabular-nums">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">User {order.user_id}</td>
                    <td className="px-6 py-4 text-zinc-300 tabular-nums">៛ {khrAmount}</td>
                    <td className="px-6 py-4 text-zinc-300 tabular-nums">${usdAmount}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status === 'PAID' ? 'Success' : order.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#222] bg-[#050505]">
          <div className="text-xs text-zinc-500">
            Showing {orders.length > 0 ? page * limit + 1 : 0} to {Math.min((page + 1) * limit, total)} of {total} entries
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              className="h-8 text-xs" 
              disabled={page === 0 || isLoading}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button 
              variant="secondary" 
              className="h-8 text-xs" 
              disabled={page >= totalPages - 1 || isLoading}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
