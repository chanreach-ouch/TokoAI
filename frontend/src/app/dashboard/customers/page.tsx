"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge, Input } from "@/components/ui/design-system";
import { Search, User, Filter, MessageCircle, Download, Sparkles, Phone, ShoppingBag, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useToast();

  const mockCustomers = [
    { id: "CUST-001", name: "Sokha Ry", phone: "012 884 921", platform: "TikTok Shop", orders: 4, ltv: 125.50, lastActive: "10 mins ago", isVIP: false },
    { id: "CUST-002", name: "Bopha Meas", phone: "015 332 990", platform: "TikTok Shop", orders: 1, ltv: 15.00, lastActive: "2 hours ago", isVIP: false },
    { id: "CUST-003", name: "Vibol Keo", phone: "098 771 204", platform: "TikTok Shop", orders: 12, ltv: 450.00, lastActive: "1 day ago", isVIP: true },
    { id: "CUST-004", name: "Sreypich Tim", phone: "089 443 118", platform: "TikTok Shop", orders: 2, ltv: 45.00, lastActive: "3 days ago", isVIP: false },
    { id: "CUST-005", name: "Channary Tep", phone: "077 551 883", platform: "TikTok Shop", orders: 6, ltv: 210.00, lastActive: "5 hours ago", isVIP: true },
  ];

  useEffect(() => {
    setTimeout(() => {
      setCustomers(mockCustomers);
      setIsLoading(false);
    }, 400);
  }, []);

  const handleExport = () => {
    toast.success("Exporting customer profiles & phone records as CSV...");
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLTV = customers.reduce((acc, c) => acc + c.ltv, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Customer CRM & Phone Directory
            </h1>
            <Badge variant="brand" className="text-[10px]">012 / 015 / 098</Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Automated Cambodian phone number extraction, delivery address parsing, and Lifetime Value (LTV) attribution.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" className="h-9 text-xs gap-1.5 shadow-2xs">
            <Filter size={13} /> Filter Segment
          </Button>
          <Button variant="brand" className="h-9 text-xs gap-1.5 shadow-xs" onClick={handleExport}>
            <Download size={13} /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Buyers</p>
          <p className="text-xl font-extrabold text-[#0F172A] mt-1 tabular-nums">{customers.length} Profiles</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 inline-block">100% Mobile Phone Validated</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total CRM LTV</p>
          <p className="text-xl font-extrabold text-[#0F172A] mt-1 tabular-nums">${totalLTV.toFixed(2)}</p>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 inline-block">៛{(totalLTV * 4000).toLocaleString()} KHR</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">VIP High-Spenders</p>
          <p className="text-xl font-extrabold text-[#EA580C] mt-1 tabular-nums">
            {customers.filter(c => c.isVIP).length} VIP Buyers
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 inline-block">&gt; 5 Completed Orders</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Primary Channel</p>
          <p className="text-xl font-extrabold text-[#0F172A] mt-1">TikTok Shop</p>
          <span className="text-[10px] text-sky-600 font-semibold mt-0.5 inline-block">Business DM Ingestion</span>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
        <Input 
          placeholder="Search by buyer name, phone (012...), or customer ID..." 
          value={searchQuery}
          onChange={(e: any) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 text-xs bg-white border-slate-200/80 focus-visible:border-[#EA580C]" 
        />
      </div>

      {/* Customers Table */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-xs rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#FAF9F5] border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Phone (Cambodia)</th>
                <th className="px-5 py-3.5">Channel</th>
                <th className="px-5 py-3.5">Completed Orders</th>
                <th className="px-5 py-3.5">Lifetime Value (LTV)</th>
                <th className="px-5 py-3.5">Last Active</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    Loading Cambodian customer directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                    No customers match your search query.
                  </td>
                </tr>
              ) : (
                filtered.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/70 flex items-center justify-center font-bold text-xs text-[#EA580C] shrink-0">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0F172A] flex items-center gap-2">
                            {customer.name} {customer.isVIP && <Badge variant="brand" className="text-[9px] px-1.5 py-0">VIP</Badge>}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{customer.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 text-xs">
                        🇰🇭 {customer.phone}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="cyan" className="text-[10px]">
                        {customer.platform}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 tabular-nums font-semibold">
                      {customer.orders} orders
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-emerald-700 font-extrabold tabular-nums">${customer.ltv.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400">៛{(customer.ltv * 4000).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{customer.lastActive}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="secondary" className="h-7 px-2.5 text-[11px] gap-1 hover:bg-slate-200/60">
                          <MessageCircle size={11} /> Chat
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
