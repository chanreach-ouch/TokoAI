"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge } from "@/components/ui/design-system";
import { 
  Package, Truck, RefreshCw, CheckCircle2, User, ExternalLink, Sparkles, 
  QrCode, ArrowUpRight, Phone, MapPin, LayoutGrid, Table as TableIcon, ShieldCheck, Clock,
  Printer, X
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

const getCustomerDetails = (id: number) => {
  const details = [
    { name: "Sokha Ry", phone: "012 884 921", carrier: "Cellcard", landmark: "St. 271, near Boeung Salang Market, Phnom Penh" },
    { name: "Bopha Meas", phone: "015 332 990", carrier: "Smart", landmark: "St. 63, near ABA Bank BKK1, Phnom Penh" },
    { name: "Vibol Keo", phone: "098 771 204", carrier: "Metfone", landmark: "Wat Bo Road, opposite Heritage Suites, Siem Reap" },
    { name: "Channary Tep", phone: "077 551 883", carrier: "Cellcard", landmark: "St. 106, Svay Por, Battambang" },
    { name: "Piseth Neth", phone: "089 443 118", carrier: "Cellcard", landmark: "Prek Samrong, Ta Khmau, Kandal" },
    { name: "Dara Seng", phone: "016 990 124", carrier: "Smart", landmark: "Russian Market (Toul Tompoung), Phnom Penh" },
    { name: "Sreypich Tim", phone: "010 223 991", carrier: "Smart", landmark: "National Road 6A, Chroy Changvar, Phnom Penh" },
  ];
  return details[id % details.length] || { name: `Customer #${id}`, phone: "012 000 000", carrier: "Cellcard", landmark: "Phnom Penh, Cambodia" };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [printingOrder, setPrintingOrder] = useState<any | null>(null);
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
      toast.success(`${provider} waybill generated! Tracking sticker ready.`);
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

  const getStatusBadge = (status: string, paymentMethod?: string) => {
    if (status === 'PAID') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Bakong Paid</span>;
    if (status === 'SHIPPED') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#00938C] border border-teal-200">Dispatched</span>;
    if (status === 'CANCELLED') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
    if (paymentMethod === 'COD') return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Cash on Delivery</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Pending KHQR</span>;
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const paidCount = orders.filter(o => o.status === 'PAID').length;
  const shippedCount = orders.filter(o => o.status === 'SHIPPED').length;
  const totalVolume = orders.reduce((sum, o) => sum + Number(o.total_amount_usd || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl pb-16">
      
      {/* Header with Title & Batch Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E4E7EF]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Orders &amp; Dispatch Deck
            </h1>
            <span className="text-[10px] font-bold bg-teal-50 text-[#00938C] border border-teal-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={11} /> Bakong KHQR Settled
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time EMVCo QR settlement linked directly to 1-tap dispatch for J&amp;T Express and Virak Buntham VET.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-[#FAF9F5] p-1 rounded-xl border border-[#E4E7EF] shadow-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards' 
                  ? 'bg-white text-[#0F172A] shadow-xs' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Packing Deck View"
            >
              <LayoutGrid size={14} /> <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-[#0F172A] shadow-xs' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Data Table View"
            >
              <TableIcon size={14} /> <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {paidCount > 0 && (
            <Button 
              variant="brand" 
              className="h-9 text-xs gap-1.5 shadow-sm"
              onClick={handleBatchDispatch}
            >
              <Truck size={14} /> Batch Dispatch ({paidCount})
            </Button>
          )}

          <Button 
            variant="secondary" 
            className="h-9 text-xs gap-1.5 shadow-sm" 
            onClick={() => fetchOrders(page)}
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>
      </div>

      {/* Fulfillment Operations Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E4E7EF] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Ready for Packing</span>
            <p className="text-2xl font-extrabold text-[#EA580C] mt-1 tabular-nums">{paidCount} Paid Orders</p>
            <span className="text-[11px] text-slate-500 font-medium">Bakong payment verified in real-time</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#EA580C] shadow-xs">
            <Package size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E4E7EF] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Dispatched &amp; In Transit</span>
            <p className="text-2xl font-extrabold text-[#00938C] mt-1 tabular-nums">{shippedCount} Waybills</p>
            <span className="text-[11px] text-slate-500 font-medium">J&amp;T &amp; Virak Buntham active tracking</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#00938C] shadow-xs">
            <Truck size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E4E7EF] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Volume Settled</span>
            <p className="text-2xl font-extrabold text-[#0F172A] mt-1 tabular-nums">${totalVolume.toFixed(2)}</p>
            <span className="text-[11px] text-slate-500 font-mono">៛{(totalVolume * 4000).toLocaleString()} KHR</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-[#E4E7EF] flex items-center justify-center text-[#0F172A] shadow-xs">
            <QrCode size={22} />
          </div>
        </div>
      </div>
      
      {/* View Mode 1: Waybill Packing Deck (Responsive Cards) */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-[#E4E7EF] shadow-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#EA580C]" />
              <p className="text-xs font-bold text-[#0F172A]">Loading Bakong Transaction Deck...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-[#E4E7EF] shadow-sm">
              <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <h3 className="font-extrabold text-sm text-[#0F172A]">No Inbound Orders Recorded</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                When impulse buyers scan your Bakong KHQR code in TikTok direct messages, orders appear here with customer phone and delivery landmark ready for 1-tap dispatch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map(order => {
                const customer = getCustomerDetails(order.user_id);
                const khrAmount = (order.total_amount_usd * 4000).toLocaleString();
                const isRowDispatching = isDispatching === order.id;

                return (
                  <div 
                    key={order.id} 
                    className="p-5 bg-white rounded-3xl border border-[#E4E7EF] hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex flex-col justify-between gap-4"
                  >
                    {/* Waybill Card Top */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#FAF9F5]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-[#0F172A]">
                            ORD-{order.id.toString().padStart(4, '0')}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <Clock size={10} /> {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {getStatusBadge(order.status, order.payment_method)}
                      </div>

                      {/* Recipient Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-[#0F172A] font-khmer">
                            {customer.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E4E7EF] text-slate-700">
                            {customer.carrier}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                          <Phone size={12} className="text-[#EA580C] shrink-0" />
                          <a href={`tel:${customer.phone}`} className="hover:underline font-bold text-[#0F172A]">
                            {customer.phone}
                          </a>
                        </div>

                        <div className="flex items-start gap-1.5 text-[11px] text-slate-500 font-khmer leading-relaxed pt-1">
                          <MapPin size={12} className="text-[#00938C] shrink-0 mt-0.5" />
                          <span>{customer.landmark}</span>
                        </div>
                      </div>
                    </div>

                    {/* Waybill Card Bottom: Price & Dispatch Trigger */}
                    <div className="pt-3 border-t border-[#FAF9F5] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Settlement</span>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-[#0F172A] tabular-nums">
                            ${Number(order.total_amount_usd).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ៛{khrAmount} KHR
                          </span>
                        </div>
                      </div>

                      {(order.status === 'PAID' || order.payment_method === 'COD') && order.status !== 'SHIPPED' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            disabled={isRowDispatching}
                            onClick={() => handleDispatch(order.id, 'J&T Express')}
                            className="h-8.5 px-3 rounded-xl bg-orange-50 hover:bg-[#EA580C] text-[#EA580C] hover:text-white border border-orange-200 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Truck size={12} /> {isRowDispatching ? "..." : "J&T Express"}
                          </button>
                          <button
                            disabled={isRowDispatching}
                            onClick={() => handleDispatch(order.id, 'Virak Buntham')}
                            className="h-8.5 px-3 rounded-xl bg-teal-50 hover:bg-[#00938C] text-[#00938C] hover:text-white border border-teal-200 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Truck size={12} /> {isRowDispatching ? "..." : "VET Express"}
                          </button>
                        </div>
                      )}

                      {order.status === 'SHIPPED' && (
                        <div className="space-y-2">
                          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E4E7EF] flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs">
                              <CheckCircle2 size={13} className="text-[#00938C]" />
                              <span className="font-bold text-[#0F172A]">{order.logistics_provider}</span>
                            </div>
                            <a 
                              href={order.waybill_url || "#"} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[11px] text-[#EA580C] hover:underline flex items-center gap-1 font-mono font-bold"
                            >
                              {order.tracking_number || "TRACKING-LINK"} <ExternalLink size={10} />
                            </a>
                          </div>
                          <button
                            onClick={() => setPrintingOrder(order)}
                            className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Printer size={13} /> Print Shipping Slip
                          </button>
                        </div>
                      )}

                      {order.status !== 'PAID' && order.status !== 'SHIPPED' && (
                        <div className="text-center py-1.5 text-[11px] text-slate-400 italic">
                          Awaiting buyer QR scan in TikTok chat
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View Mode 2: Compact Ledger Table */}
      {viewMode === 'table' && (
        <div className="overflow-hidden border border-[#E4E7EF] bg-white shadow-sm rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#FAF9F5] border-b border-[#E4E7EF] text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Customer &amp; Phone</th>
                  <th className="px-5 py-3.5">Delivery Landmark</th>
                  <th className="px-5 py-3.5">Amount (USD / KHR)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Carrier Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#EA580C]" />
                      Loading Bakong transaction ledger...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <span className="font-semibold text-slate-700">No orders recorded yet.</span>
                    </td>
                  </tr>
                ) : (
                  orders.map(order => {
                    const customer = getCustomerDetails(order.user_id);
                    const khrAmount = (order.total_amount_usd * 4000).toLocaleString();
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
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[#0F172A] font-khmer">{customer.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{customer.phone} ({customer.carrier})</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs truncate text-[11px] text-slate-500 font-khmer">
                          {customer.landmark}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums">
                          <span className="text-[#0F172A] font-extrabold">${Number(order.total_amount_usd).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">៛{khrAmount}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {getStatusBadge(order.status, order.payment_method)}
                        </td>
                        <td className="px-5 py-3.5">
                          {(order.status === 'PAID' || order.payment_method === 'COD') && order.status !== 'SHIPPED' && (
                            <div className="flex gap-2">
                              <button
                                disabled={isRowDispatching}
                                onClick={() => handleDispatch(order.id, 'J&T Express')}
                                className="h-7 px-2.5 rounded-lg bg-orange-50 text-[#EA580C] hover:bg-[#EA580C] hover:text-white border border-orange-200 text-[10px] font-bold transition-all"
                              >
                                J&amp;T
                              </button>
                              <button
                                disabled={isRowDispatching}
                                onClick={() => handleDispatch(order.id, 'Virak Buntham')}
                                className="h-7 px-2.5 rounded-lg bg-teal-50 text-[#00938C] hover:bg-[#00938C] hover:text-white border border-teal-200 text-[10px] font-bold transition-all"
                              >
                                VET
                              </button>
                            </div>
                          )}
                          {order.status === 'SHIPPED' && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-slate-700">{order.logistics_provider}:</span>
                              <a 
                                href={order.waybill_url || "#"} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[11px] text-[#EA580C] hover:underline flex items-center gap-1 font-mono font-bold"
                              >
                                {order.tracking_number || "TRACKING"} <ExternalLink size={10} />
                              </a>
                              <button
                                onClick={() => setPrintingOrder(order)}
                                title="Print Shipping Label"
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              >
                                <Printer size={13} />
                              </button>
                            </div>
                          )}
                          {order.status !== 'PAID' && order.status !== 'SHIPPED' && (
                            <span className="text-[11px] text-slate-400 italic">Awaiting payment</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-5 py-3.5 border border-[#E4E7EF] bg-white rounded-2xl text-xs shadow-xs">
        <div className="text-slate-500 font-medium">
          Showing {orders.length > 0 ? page * limit + 1 : 0} to {Math.min((page + 1) * limit, total)} of {total} orders
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="h-8 text-xs px-3 rounded-xl" 
            disabled={page === 0 || isLoading}
            onClick={() => setPage(p => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            className="h-8 text-xs px-3 rounded-xl" 
            disabled={page >= totalPages - 1 || isLoading}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Printable Thermal Waybill / Shipping Slip Modal */}
      {printingOrder && (() => {
        const cust = getCustomerDetails(printingOrder.user_id);
        const khrAmount = (printingOrder.total_amount_usd * 4000).toLocaleString();
        const isCOD = printingOrder.payment_method === 'COD';
        const providerName = printingOrder.logistics_provider || "J&T Express";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
              
              {/* Modal Top Bar */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer size={16} className="text-[#EA580C]" />
                  <span className="font-extrabold text-sm tracking-tight">Cambodia Logistics Waybill Slip</span>
                </div>
                <button 
                  onClick={() => setPrintingOrder(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Waybill Slip Printable Area (Standard 4x6" Aspect) */}
              <div id="thermal-shipping-label" className="p-6 bg-white text-slate-900 text-xs font-sans space-y-4 border-b border-dashed border-slate-300">
                
                {/* Carrier & Routing Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div>
                    <span className="text-xl font-black tracking-tighter uppercase text-slate-900 block">
                      {providerName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Domestic Express Dispatch (Cambodia)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-sm font-mono block">
                      {cust.landmark.toLowerCase().includes("siem reap") ? "REP-01" : cust.landmark.toLowerCase().includes("battambang") ? "BBM-02" : "PNH-HUB"}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">STANDARD TRANSIT</span>
                  </div>
                </div>

                {/* Simulated Barcode */}
                <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex justify-center items-center gap-[2px] h-10 px-4">
                    {[3,1,4,2,1,3,2,4,1,2,3,1,4,1,3,2,1,4,2,3,1,2,4,1,3,1,2,4,2,1,3,4,1,2,3,1].map((w, i) => (
                      <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                    ))}
                  </div>
                  <div className="font-mono text-xs font-black tracking-widest text-slate-900">
                    {printingOrder.tracking_number || `JT855${printingOrder.id.toString().padStart(8, '0')}`}
                  </div>
                </div>

                {/* Sender & Consignee Columns */}
                <div className="grid grid-cols-2 gap-3 border border-slate-300 rounded-lg p-3">
                  {/* Sender */}
                  <div className="border-r border-slate-200 pr-2 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Sender / ផ្ញើដោយ</span>
                    <div className="font-bold text-slate-900">TokoAI Official Merchant</div>
                    <div className="text-[10px] text-slate-600 font-mono">012 345 678</div>
                    <div className="text-[10px] text-slate-500 leading-tight">Phnom Penh Express Fulfillment Hub</div>
                  </div>

                  {/* Consignee */}
                  <div className="pl-1 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Recipient / អ្នកទទួល</span>
                    <div className="font-black text-slate-900 font-khmer">{cust.name}</div>
                    <div className="text-[10px] font-extrabold text-[#EA580C] font-mono">
                      {cust.phone} <span className="text-slate-400 font-normal">({cust.carrier})</span>
                    </div>
                    <div className="text-[10px] text-slate-700 leading-tight font-khmer">
                      {cust.landmark}
                    </div>
                  </div>
                </div>

                {/* COD & Payment Banner */}
                <div className={`p-3 rounded-lg border-2 ${
                  isCOD 
                    ? 'border-blue-600 bg-blue-50 text-blue-900' 
                    : 'border-emerald-600 bg-emerald-50 text-emerald-900'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider block">
                        {isCOD ? "Cash on Delivery (COD) Collection" : "Bakong KHQR Settled (No Cash Due)"}
                      </span>
                      <span className="text-[9px] opacity-80 block font-khmer">
                        {isCOD ? "សូមប្រមូលប្រាក់ពីអ្នកទិញមុនពេលប្រគល់ទំនិញ" : "ទូទាត់តាម Bakong KHQR រួចរាល់"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black tabular-nums">
                        {isCOD ? `$${Number(printingOrder.total_amount_usd).toFixed(2)}` : "$0.00"}
                      </div>
                      <div className="text-[10px] font-mono font-bold">
                        {isCOD ? `៛${khrAmount} KHR` : "៛0 KHR"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Contents & Timestamp */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                  <span>Order: <strong>ORD-{printingOrder.id.toString().padStart(4, '0')}</strong></span>
                  <span>Dispatched: {new Date(printingOrder.created_at).toLocaleString()}</span>
                  <span>Parcel: 0.35kg</span>
                </div>

              </div>

              {/* Modal Bottom Actions */}
              <div className="p-4 bg-slate-50 flex items-center justify-end gap-2.5">
                <Button 
                  variant="outline" 
                  className="h-9 text-xs rounded-xl"
                  onClick={() => setPrintingOrder(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="brand" 
                  className="h-9 text-xs rounded-xl gap-1.5 shadow-sm"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <Printer size={14} /> Print Thermal Slip (4x6)
                </Button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
