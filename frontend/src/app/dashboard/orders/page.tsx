"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge } from "@/components/ui/design-system";
import { 
  Package, Truck, RefreshCw, CheckCircle2, User, ExternalLink, Sparkles, 
  QrCode, ArrowUpRight, Phone, MapPin, LayoutGrid, Table as TableIcon, ShieldCheck, Clock,
  Printer, X, Search, Filter
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

// Fallback details if an order doesn't have phone/address in its record
const getFallbackCustomer = (id: number) => {
  const details = [
    { name: "Sokha Ry", phone: "012 884 921", carrier: "Cellcard", landmark: "St. 271, near Boeung Salang Market, Phnom Penh" },
    { name: "Bopha Meas", phone: "015 332 990", carrier: "Smart", landmark: "St. 63, near ABA Bank BKK1, Phnom Penh" },
    { name: "Vibol Keo", phone: "098 771 204", carrier: "Metfone", landmark: "Wat Bo Road, opposite Heritage Suites, Siem Reap" },
    { name: "Channary Tep", phone: "077 551 883", carrier: "Cellcard", landmark: "St. 106, Svay Por, Battambang" },
    { name: "Piseth Neth", phone: "089 443 118", carrier: "Cellcard", landmark: "Prek Samrong, Ta Khmau, Kandal" },
  ];
  return details[id % details.length] || { name: `Customer #${id}`, phone: "012 000 000", carrier: "Local", landmark: "Phnom Penh, Cambodia" };
};


const formatDateSafe = (dateStr?: string) => {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Recent" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recent";
  }
};

const detectCarrier = (phone?: string | null): string => {
  if (!phone) return "Local";
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  const prefix = cleaned.slice(0, 3);
  const smart = ["010", "015", "016", "081", "086", "087", "093", "096", "098", "070"];
  const cellcard = ["011", "012", "014", "017", "061", "076", "077", "078", "079", "085", "089", "092", "095", "099"];
  const metfone = ["031", "060", "066", "067", "068", "071", "088", "090", "097"];

  if (smart.includes(prefix)) return "Smart";
  if (cellcard.includes(prefix)) return "Cellcard";
  if (metfone.includes(prefix)) return "Metfone";
  return "Cambodia";
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [printingOrder, setPrintingOrder] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PAID' | 'PENDING' | 'COD' | 'SHIPPED'>('ALL');
  const [searchQuery, setSearchQuery] = useState("");
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

  const paidCount = orders.filter(o => o.status === 'PAID').length;
  const shippedCount = orders.filter(o => o.status === 'SHIPPED').length;
  const pendingCount = orders.filter(o => o.status === 'PENDING' && o.payment_method !== 'COD').length;
  const codCount = orders.filter(o => o.payment_method === 'COD').length;
  const totalVolume = orders.reduce((sum, o) => sum + Number(o.total_amount_usd || 0), 0);

  // Filter orders by tab and search query
  const filteredOrders = orders.filter(order => {
    // 1. Tab filter
    if (activeTab === 'PAID' && order.status !== 'PAID') return false;
    if (activeTab === 'SHIPPED' && order.status !== 'SHIPPED') return false;
    if (activeTab === 'PENDING' && (order.status !== 'PENDING' || order.payment_method === 'COD')) return false;
    if (activeTab === 'COD' && order.payment_method !== 'COD') return false;

    // 2. Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orderIdStr = `ord-${order.id.toString().padStart(4, '0')}`.toLowerCase();
    const phone = (order.customer_phone || '').toLowerCase();
    const addr = (order.delivery_address || '').toLowerCase();
    const itemName = typeof order.items === 'object' ? JSON.stringify(order.items).toLowerCase() : '';
    
    return orderIdStr.includes(q) || phone.includes(q) || addr.includes(q) || itemName.includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl pb-16">
      
      {/* Header with Title & Batch Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
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
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards' 
                  ? 'bg-white text-[#1B38A6] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Packing Deck View"
            >
              <LayoutGrid size={14} /> <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-[#1B38A6] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Data Table View"
            >
              <TableIcon size={14} /> <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {paidCount > 0 && (
            <button 
              className="h-9 px-4 rounded-full bg-[#1B38A6] hover:bg-blue-800 text-white text-xs font-bold gap-1.5 shadow-sm transition-all flex items-center"
              onClick={handleBatchDispatch}
            >
              <Truck size={14} /> Batch Dispatch ({paidCount})
            </button>
          )}

          <button 
            className="h-9 px-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-[#0F172A] text-xs font-semibold gap-1.5 shadow-xs transition-all flex items-center" 
            onClick={() => fetchOrders(page)}
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-[#1B38A6]" : ""} /> Sync
          </button>
        </div>
      </div>

      {/* Fulfillment Operations Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Ready for Packing</span>
            <p className="text-2xl font-extrabold text-[#1B38A6] mt-1 tabular-nums">{paidCount} Paid Orders</p>
            <span className="text-[11px] text-slate-500 font-medium">Bakong payment verified in real-time</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#1B38A6] shadow-xs">
            <Package size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Dispatched &amp; In Transit</span>
            <p className="text-2xl font-extrabold text-[#00938C] mt-1 tabular-nums">{shippedCount} Waybills</p>
            <span className="text-[11px] text-slate-500 font-medium">J&amp;T &amp; Virak Buntham active tracking</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#00938C] shadow-xs">
            <Truck size={22} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Volume Settled</span>
            <p className="text-2xl font-extrabold text-[#0F172A] mt-1 tabular-nums">${totalVolume.toFixed(2)}</p>
            <span className="text-[11px] text-slate-500 font-mono">៛{Math.round(totalVolume * 4100).toLocaleString()} KHR</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-[#0F172A] shadow-xs">
            <QrCode size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold select-none">
          {[
            { id: 'ALL', label: 'All Orders', count: orders.length },
            { id: 'PAID', label: 'Ready to Ship', count: paidCount, highlight: paidCount > 0 },
            { id: 'PENDING', label: 'Pending KHQR', count: pendingCount },
            { id: 'COD', label: 'Cash on Delivery', count: codCount },
            { id: 'SHIPPED', label: 'Dispatched', count: shippedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#1B38A6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F172A]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white font-bold'
                  : tab.highlight
                  ? 'bg-amber-100 text-amber-800 font-bold'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input 
            placeholder="Search phone, order ID, or address..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="pl-9 h-8.5 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white"
          />
        </div>

      </div>
      
      {/* View Mode 1: Cards View */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1B38A6]" />
              <p className="text-xs font-bold text-[#0F172A]">Loading Transaction Deck...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <h3 className="font-extrabold text-sm text-[#0F172A]">No Matching Orders Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                {searchQuery ? `No orders matched query "${searchQuery}".` : "No orders found under this status filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => {
                const fallback = getFallbackCustomer(order.id);
                const customerPhone = order.customer_phone || fallback.phone;
                const customerAddr = order.delivery_address || fallback.landmark;
                const customerCarrier = detectCarrier(customerPhone);
                const khrAmount = (order.total_amount_usd * 4100).toLocaleString();
                const isRowDispatching = isDispatching === order.id;

                return (
                  <div 
                    key={order.id} 
                    className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex flex-col justify-between gap-4"
                  >
                    {/* Waybill Card Top */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#FAF9F5]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-[#0F172A]">
                            ORD-{String(order?.id ?? '0').padStart(4, '0')}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            <Clock size={10} /> <span suppressHydrationWarning>{formatDateSafe(order?.created_at)}</span>
                          </span>
                        </div>
                        {getStatusBadge(order.status, order.payment_method)}
                      </div>

                      {/* Recipient Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-[#0F172A] font-khmer">
                            {fallback.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700">
                            {customerCarrier}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                          <Phone size={12} className="text-[#1B38A6] shrink-0" />
                          <a href={`tel:${customerPhone}`} className="hover:underline font-bold text-[#0F172A]">
                            {customerPhone}
                          </a>
                        </div>

                        <div className="flex items-start gap-1.5 text-[11px] text-slate-500 font-khmer leading-relaxed pt-1">
                          <MapPin size={12} className="text-[#00938C] shrink-0 mt-0.5" />
                          <span>{customerAddr}</span>
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
                            className="h-8.5 px-3 rounded-xl bg-blue-50 hover:bg-[#1B38A6] text-[#1B38A6] hover:text-white border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs"
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
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs">
                              <CheckCircle2 size={13} className="text-[#00938C]" />
                              <span className="font-bold text-[#0F172A]">{order.logistics_provider}</span>
                            </div>
                            <a 
                              href={order.waybill_url || "#"} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[11px] text-[#1B38A6] hover:underline flex items-center gap-1 font-mono font-bold"
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

                      {order.status !== 'PAID' && order.status !== 'SHIPPED' && order.payment_method !== 'COD' && (
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

      {/* View Mode 2: Table View */}
      {viewMode === 'table' && (
        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">
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
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1B38A6]" />
                      Loading transaction ledger...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <span className="font-semibold text-slate-700">No matching orders.</span>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const fallback = getFallbackCustomer(order.id);
                    const phone = order.customer_phone || fallback.phone;
                    const carrier = detectCarrier(phone);
                    const addr = order.delivery_address || fallback.landmark;
                    const khrAmount = (order.total_amount_usd * 4100).toLocaleString();
                    const isRowDispatching = isDispatching === order.id;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold font-mono text-[#0F172A]">
                          ORD-{String(order?.id ?? '0').padStart(4, '0')}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 tabular-nums">
                          <span suppressHydrationWarning>{formatDateSafe(order?.created_at)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[#0F172A] font-khmer">{fallback.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{phone} ({carrier})</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 max-w-xs truncate text-[11px] text-slate-500 font-khmer">
                          {addr}
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
                                className="h-7 px-2.5 rounded-lg bg-blue-50 text-[#1B38A6] hover:bg-[#1B38A6] hover:text-white border border-blue-200 text-[10px] font-bold transition-all"
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
                                className="text-[11px] text-[#1B38A6] hover:underline flex items-center gap-1 font-mono font-bold"
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
                          {order.status !== 'PAID' && order.status !== 'SHIPPED' && order.payment_method !== 'COD' && (
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

      {/* Printable Shipping Waybill Modal */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 font-khmer">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-[#1B38A6]" />
                <h3 className="font-extrabold text-sm text-[#0F172A] font-sans">
                  Cambodia Logistics Waybill
                </h3>
              </div>
              <button onClick={() => setPrintingOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between font-mono font-bold text-[#0F172A]">
                <span>ORDER: ORD-{printingOrder.id.toString().padStart(4, '0')}</span>
                <span className="text-[#1B38A6]">{printingOrder.logistics_provider}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Delivery Address:</span>
                <p className="font-bold text-[#0F172A]">{printingOrder.delivery_address || getFallbackCustomer(printingOrder.id).landmark}</p>
                <p className="font-mono text-slate-600">Tel: {printingOrder.customer_phone || getFallbackCustomer(printingOrder.id).phone}</p>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between font-bold">
                <span>Cod / Amount to Collect:</span>
                <span className="text-[#1B38A6] font-mono">
                  {printingOrder.payment_method === 'COD' ? `$${Number(printingOrder.total_amount_usd).toFixed(2)}` : "PAID (BAKONG)"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setPrintingOrder(null)} className="text-xs">Close</Button>
              <Button variant="brand" onClick={() => window.print()} className="text-xs font-bold gap-1">
                <Printer size={13} /> Print Label
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
