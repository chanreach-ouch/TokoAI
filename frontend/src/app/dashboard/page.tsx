"use client";

import { Card, Button, Badge } from "@/components/ui/design-system";
import { 
  AlertCircle, CheckCircle2, TrendingUp, Package, 
  MessageSquareWarning, Sparkles, ArrowRight, ShieldCheck, Zap,
  Clock, ArrowUpRight, ShoppingBag, Store
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Command Cockpit</h1>
            <span className="text-xs bg-orange-50 text-[#EA580C] px-2.5 py-0.5 rounded-full font-bold border border-orange-200/80 flex items-center gap-1">
              <Zap size={12} className="fill-[#EA580C]" /> Live Engine
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Good morning. Here is what your autonomous sales bot completed overnight in Phnom Penh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/inbox">
            <Button variant="primary" className="h-9 gap-2 text-xs">
              Open Live Inbox <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Triage (Needs Attention) */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-2">
          <AlertCircle size={15} className="text-amber-500" /> Immediate Action Required
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 border-amber-200/80 bg-gradient-to-br from-white to-amber-50/40 hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100/70 border border-amber-200/80 flex items-center justify-center shrink-0">
                <MessageSquareWarning size={22} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">2 AI Drafts Pending Review</h3>
                <p className="text-xs text-slate-500 mt-0.5">Custom discount request requires shop owner approval.</p>
              </div>
            </div>
            <Link href="/dashboard/inbox" className="shrink-0">
              <button className="h-8 px-4 rounded-full text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-2xs transition-all w-full sm:w-auto">
                Review Drafts
              </button>
            </Link>
          </Card>

          <Card className="p-5 border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center shrink-0">
                <Package size={22} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">4 Orders Paid via KHQR</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bakong verified ($65.00). Ready for J&T Express dispatch.</p>
              </div>
            </div>
            <Link href="/dashboard/orders" className="shrink-0">
              <button className="h-8 px-4 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-all w-full sm:w-auto">
                Dispatch Now
              </button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Pulse / Core Metrics (Styled after Skyrocket & Active) */}
      <div className="space-y-3.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles size={14} className="text-[#EA580C]" /> 24-Hour Operations Pulse
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 flex flex-col justify-between gap-2.5 hover:border-slate-300 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Autonomy Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#0F172A] tracking-tight">94%</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/70">+2.4%</span>
            </div>
            <span className="text-[11px] text-slate-500">Autonomous chats without human takeover</span>
          </Card>

          <Card className="p-5 flex flex-col justify-between gap-2.5 hover:border-slate-300 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Abandoned Carts Saved</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#EA580C] tracking-tight">12</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] text-[10px] font-bold border border-orange-200/70">Recovered</span>
            </div>
            <span className="text-[11px] text-slate-500">Re-engaged via automated spoken Khmer DMs</span>
          </Card>

          <Card className="p-5 flex flex-col justify-between gap-2.5 hover:border-slate-300 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 tracking-tight">$845.00</span>
              <span className="text-[10px] font-mono text-slate-400">៛3.46M</span>
            </div>
            <span className="text-[11px] text-slate-500">Bakong KHQR Webhook verified in real time</span>
          </Card>

          <Card className="p-5 flex flex-col justify-between gap-2.5 hover:border-slate-300 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trust Engine Status</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <span className="text-lg font-bold text-[#0F172A]">Autonomous</span>
            </div>
            <Link href="/dashboard/settings" className="text-[11px] text-[#EA580C] hover:underline font-bold flex items-center gap-1">
              Configure Safeguards <ArrowRight size={12} />
            </Link>
          </Card>
        </div>
      </div>

      {/* Live Operations & Activity Feed (Executive Density from Skyrocket) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Columns: Recent Live Orders Dispatched */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Live Inbound Orders</h3>
              <p className="text-xs text-slate-400">Captured and verified automatically via Bakong KHQR</p>
            </div>
            <Link href="/dashboard/orders" className="text-xs font-bold text-[#EA580C] hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {[
              { id: "ORD-8821", name: "Vicheka Sok", phone: "012 884 921", location: "Phnom Penh", item: "Oversized Streetwear Tee (L)", price: "$19.00", status: "PAID", statusClass: "bg-emerald-50 text-emerald-700 border-emerald-200/70" },
              { id: "ORD-8820", name: "Sreynich Chan", phone: "098 554 112", location: "Siem Reap", item: "Baggy Denim Cargo (30)", price: "$34.00", status: "DISPATCHED", statusClass: "bg-blue-50 text-blue-700 border-blue-200/70" },
              { id: "ORD-8819", name: "Borey Heng", phone: "015 332 990", location: "Battambang", item: "Vintage Wash Cap", price: "$12.00", status: "PAID", statusClass: "bg-emerald-50 text-emerald-700 border-emerald-200/70" },
              { id: "ORD-8818", name: "Dalin Pich", phone: "089 443 118", location: "Kandal", item: "Graphic Hoodie (XL)", price: "$28.00", status: "SHIPPED (VET)", statusClass: "bg-amber-50 text-amber-800 border-amber-200/70" }
            ].map((ord) => (
              <div key={ord.id} className="p-3 bg-[#FAF9F5] rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center font-bold text-[#EA580C] text-[11px] shadow-2xs">
                    {ord.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                      {ord.name}
                      <span className="text-[10px] text-slate-400 font-mono font-normal">{ord.id}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{ord.item} • {ord.location}</div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-extrabold text-[#0F172A]">{ord.price}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${ord.statusClass}`}>
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Columns: Conversion & Autonomy Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">AI Sales Performance</h3>
              <p className="text-xs text-slate-400">Night shift vs. Day shift attribution</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200/70">
              Live Stream Mode
            </span>
          </div>

          {/* Mini Gauge / Radial Display */}
          <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-slate-200/70 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Midnight Conversion</span>
              <div className="text-2xl font-black text-[#0F172A]">68.4%</div>
              <p className="text-[11px] text-emerald-600 font-semibold">↑ 3.2x vs human staff response</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-[#EA580C] border-r-[#EA580C] flex items-center justify-center font-bold text-xs text-[#0F172A]">
              68%
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Autonomous Inbound DMs:</span>
              <span className="font-bold text-[#0F172A]">2,460 Chats</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Average Reply Latency:</span>
              <span className="font-bold text-[#EA580C]">1.1 Seconds</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500">Staff Cost Saved (Night):</span>
              <span className="font-bold text-emerald-700">$450 / month</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
