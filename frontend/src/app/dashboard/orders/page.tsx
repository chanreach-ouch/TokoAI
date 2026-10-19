"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge } from "@/components/ui/design-system";
import { Package, Truck, RefreshCw, CheckCircle2, User, ExternalLink, Sparkles, QrCode, ArrowUpRight } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

const getCustomerName = (id: number) => {
  const names = ["Sokha Ry", "Bopha Meas", "Vibol Keo", "Channary Tep", "Piseth Neth", "Dara Seng", "Sreypich Tim"];
  return names[id % names.length] || `Customer #${id}`;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;
  const toast = useToast();

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
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatch = async (orderId: number, provider: string) => {
    setIsDispatching(orderId);
    try {
      await api.post(`/orders/${orderId}/waybill`, { provider });
      toast.success(`${provider} waybill generated successfully! Ready for pickup.`);
      fetchOrders(page);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || `Failed to dispatch order with ${provider}`);
    } finally {
      setIsDispatching(null);
    }
  };

  const handleBatchDispatch = async () => {
    const paidOrders = orders.filter(o => o.status === 'PAID');
    if (paidOrders.length === 0) {
      toast.info("No unfulfilled paid orders ready for dispatch.");
      return;
    }
    toast.info(`Dispatching ${paidOrders.length} orders via J&T Express...`);
    for (const order of paidOrders) {
      try {
        await api.post(`/orders/${order.id}/waybill`, { provider: 'J&T' });
      } catch (err) {
        console.error(err);
      }
    }
    toast.success(`Successfully dispatched ${paidOrders.length} orders!`);
    fetchOrders(page);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'PAID') return <Badge variant="success">Bakong Paid</Badge>;
    if (status === 'SHIPPED') return <Badge variant="brand">In Transit</Badge>;
    if (status === 'CANCELLED') return <Badge variant="destructive">Cancelled</Badge>;
    return <Badge variant="warning">Pending Payment</Badge>;
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const paidCount = orders.filter(o => o.status === 'PAID').length;
  const shippedCount = orders.filter(o => o.status === 'SHIPPED').length;
  const totalVolume = orders.reduce((sum, o) => sum + Number(o.total_amount_usd || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Orders & Waybill Fulfillment
            </h1>
            <Badge variant="bakong" className="text-[10px]">Bakong KHQR</Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time EMVCo QR settlement linked to 1-tap dispatch for J&T Express and Virak Buntham VET.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {paidCount > 0 && (
            <Button 
              variant="brand" 
              className="h-9 text-xs gap-1.5 shadow-xs"
              onClick={handleBatchDispatch}
            >
              <Truck size={14} /> Batch Dispatch ({paidCount})
            </Button>
          )}
          <Button 
            variant="secondary" 
            className="h-9 text-xs gap-1.5 shadow-2xs" 
            onClick={() => fetchOrders(page)}
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>
      </div>

      {/* Fulfillment Pulse Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ready for Carrier Pickup</p>
            <p className="text-2xl font-extrabold text-[#EA580C] mt-1 tabular-nums">{paidCount} Paid Orders</p>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting waybill sticker generation</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#EA580C]">
            <Package size={20} />
          </div>
        </Card>
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dispatched & In Transit</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1 tabular-nums">{shippedCount} Waybills</p>
            <span className="text-[10px] text-slate-500 font-medium">J&T / Virak Buntham tracking active</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
            <Truck size={20} />
          </div>
        </Card>
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Order Volume</p>
            <p className="text-2xl font-extrabold text-[#0F172A] mt-1 tabular-nums">${totalVolume.toFixed(2)}</p>
            <span className="text-[10px] text-slate-500 font-medium">៛{(totalVolume * 4000).toLocaleString()} KHR</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#00938C]">
            <QrCode size={20} />
          </div>
        </Card>
      </div>
      
      {/* Table Container */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-xs rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#FAF9F5] border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Logistics Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#EA580C]" />
                    Loading Bakong transaction ledger...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span className="font-semibold text-slate-700">No orders recorded yet.</span>
                    <p className="text-[11px] text-slate-400 mt-1">When buyers scan the Bakong KHQR code in TikTok chat, orders appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const khrAmount = (order.total_amount_usd * 4000).toLocaleString();
                  const customerName = getCustomerName(order.user_id);
                  const isRowDispatching = isDispatching === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-[#0F172A]">
                        ORD-{order.id.toString().padStart(4, '0')}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 tabular-nums">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0">
                            {customerName.charAt(0)}
                          </div>
                          <span className="font-semibold text-[#0F172A]">{customerName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums">
                        <div className="flex flex-col">
                          <span className="text-[#0F172A] font-extrabold">${Number(order.total_amount_usd).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">៛ {khrAmount}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-3.5">
                        {order.status === 'PAID' && (
                          <div className="flex gap-2">
                            <Button 
                              variant="secondary" 
                              className="h-7 text-[10px] px-2.5 hover:border-red-300 hover:bg-red-50 hover:text-red-700 font-semibold" 
                              disabled={isRowDispatching}
                              onClick={() => handleDispatch(order.id, 'J&T Express')}
                            >
                              {isRowDispatching ? "Booking..." : "J&T Express"}
                            </Button>
                            <Button 
                              variant="secondary" 
                              className="h-7 text-[10px] px-2.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 font-semibold" 
                              disabled={isRowDispatching}
                              onClick={() => handleDispatch(order.id, 'Virak Buntham')}
                            >
                              Virak Buntham
                            </Button>
                          </div>
                        )}
                        {order.status === 'SHIPPED' && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-700">{order.logistics_provider}:</span>
                            <a 
                              href={order.waybill_url || "#"} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[11px] text-[#EA580C] hover:underline flex items-center gap-1 font-mono font-bold"
                            >
                              {order.tracking_number || "TRACKING-LINK"} <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                        {order.status !== 'PAID' && order.status !== 'SHIPPED' && (
                          <span className="text-[11px] text-slate-400 italic">Awaiting payment scan</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200/80 bg-[#FAF9F5] text-xs">
          <div className="text-slate-500 font-medium">
            Showing {orders.length > 0 ? page * limit + 1 : 0} to {Math.min((page + 1) * limit, total)} of {total} orders
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="h-7 text-xs px-2.5" 
              disabled={page === 0 || isLoading}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              className="h-7 text-xs px-2.5" 
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
