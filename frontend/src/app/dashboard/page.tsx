"use client";

import { Card, Button, Badge } from "@/components/ui/design-system";
import {
  AlertCircle, CheckCircle2, TrendingUp, Package,
  MessageSquareWarning, Sparkles, ArrowRight, ShieldCheck, Zap,
  ArrowUpRight, ShoppingBag, Bot
} from "lucide-react";
import Link from "next/link";

// Stat card component for the 4-up pulse strip
function PulseCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EF] p-5 flex flex-col gap-3 shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(15,23,42,0.08)] hover:border-slate-300 transition-all duration-200">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</span>
      <div className={`text-3xl font-black tracking-tight leading-none ${accent ?? 'text-[#0F172A]'}`}>{value}</div>
      <div className="text-[11px] text-slate-500 leading-snug">{sub}</div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E7EF]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Command Cockpit</h1>
            <span className="text-[10px] bg-orange-50 text-[#EA580C] px-2.5 py-0.5 rounded-full font-bold border border-orange-200/80 flex items-center gap-1">
              <Zap size={10} className="fill-[#EA580C]" /> Live Engine
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Good morning. Here is what your autonomous sales bot completed overnight in Phnom Penh.
          </p>
        </div>
        <Link href="/dashboard/inbox">
          <Button variant="primary" className="h-9 gap-2 text-xs shrink-0">
            Open Live Inbox <ArrowRight size={14} />
          </Button>
        </Link>
      </div>

      {/* Action Triage */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
          <AlertCircle size={13} className="text-amber-500" /> Immediate Action Required
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Amber triage card */}
          <div className="bg-white rounded-2xl border border-amber-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] hover:border-amber-300 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
                <MessageSquareWarning size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">2 AI Drafts Pending Review</h3>
                <p className="text-xs text-slate-500 mt-0.5">Custom discount request requires shop owner approval.</p>
              </div>
            </div>
            <Link href="/dashboard/inbox" className="shrink-0">
              <button className="h-8 px-4 rounded-full text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm transition-all w-full sm:w-auto">
                Review Drafts
              </button>
            </Link>
          </div>

          {/* Emerald triage card */}
          <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] hover:border-emerald-300 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0">
                <Package size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">4 Orders Paid via KHQR</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bakong verified ($65.00). Ready for J&T Express dispatch.</p>
              </div>
            </div>
            <Link href="/dashboard/orders" className="shrink-0">
              <button className="h-8 px-4 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all w-full sm:w-auto">
                Dispatch Now
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 24-Hour Operations Pulse */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <Sparkles size={12} className="text-[#EA580C]" /> 24-Hour Operations Pulse
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PulseCard
            label="AI Autonomy Rate"
            value={<>94% <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 align-middle">+2.4%</span></>}
            sub="Autonomous chats without human takeover"
          />
          <PulseCard
            label="Abandoned Carts Saved"
            value="12"
            accent="text-[#EA580C]"
            sub={<><span className="inline-flex items-center gap-1 bg-orange-50 text-[#EA580C] border border-orange-200/70 px-2 py-0.5 rounded-full text-[9px] font-bold mr-1">Recovered</span>via spoken Khmer DMs</>}
          />
          <PulseCard
            label="Today's Revenue"
            value={<>$845 <span className="text-sm font-mono font-normal text-slate-400 align-middle">/ ៛3.46M</span></>}
            accent="text-emerald-600"
            sub="Bakong KHQR Webhook verified in real time"
          />
          <div className="bg-white rounded-2xl border border-[#E4E7EF] p-5 flex flex-col gap-3 shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] hover:shadow-[0_4px_16px_-2px_rgba(15,23,42,0.08)] hover:border-slate-300 transition-all duration-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Trust Engine Status</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={22} className="text-emerald-500" />
              <span className="text-lg font-bold text-[#0F172A]">Autonomous</span>
            </div>
            <Link href="/dashboard/settings" className="text-[11px] text-[#EA580C] hover:underline font-bold flex items-center gap-1">
              Configure Safeguards <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Live Operations & AI Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Recent Live Orders */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E4E7EF] p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Live Inbound Orders</h3>
              <p className="text-xs text-slate-400 mt-0.5">Captured and verified automatically via Bakong KHQR</p>
            </div>
            <Link href="/dashboard/orders" className="text-xs font-bold text-[#EA580C] hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-2">
            {[
              { id: "ORD-8821", name: "Vicheka Sok",   phone: "012 884 921", location: "Phnom Penh",  item: "Oversized Streetwear Tee (L)",   price: "$19.00", status: "PAID",         sc: "bg-emerald-50 text-emerald-700 border-emerald-200/70" },
              { id: "ORD-8820", name: "Sreynich Chan",  phone: "098 554 112", location: "Siem Reap",   item: "Baggy Denim Cargo (30)",        price: "$34.00", status: "DISPATCHED",   sc: "bg-blue-50 text-blue-700 border-blue-200/70" },
              { id: "ORD-8819", name: "Borey Heng",     phone: "015 332 990", location: "Battambang",  item: "Vintage Wash Cap",              price: "$12.00", status: "PAID",         sc: "bg-emerald-50 text-emerald-700 border-emerald-200/70" },
              { id: "ORD-8818", name: "Dalin Pich",     phone: "089 443 118", location: "Kandal",      item: "Graphic Hoodie (XL)",           price: "$28.00", status: "SHIPPED (VET)", sc: "bg-amber-50 text-amber-800 border-amber-200/70" },
            ].map((ord) => (
              <div key={ord.id} className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#E4E7EF] flex items-center justify-between text-xs hover:border-slate-300 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E4E7EF] flex items-center justify-center font-extrabold text-[#EA580C] text-[11px] shadow-sm group-hover:border-slate-300 transition-colors">
                    {ord.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                      {ord.name}
                      <span className="text-[10px] text-slate-400 font-mono font-normal">{ord.id}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{ord.item} · {ord.location}</div>
                  </div>
                </div>
                <div className="text-right space-y-1.5">
                  <div className="font-extrabold text-[#0F172A]">{ord.price}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${ord.sc}`}>{ord.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI Sales Performance */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E4E7EF] p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">AI Sales Performance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Night shift vs. Day shift attribution</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200/70">
              Live Stream Mode
            </span>
          </div>

          {/* Midnight Conversion Gauge */}
          <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E4E7EF] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Midnight Conversion</span>
              <div className="text-2xl font-black text-[#0F172A] leading-none">68.4%</div>
              <p className="text-[11px] text-emerald-600 font-semibold">↑ 3.2× vs human staff response</p>
            </div>
            {/* Radial gauge */}
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E4E7EF" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#EA580C" strokeWidth="3.5"
                  strokeDasharray="68.4 31.6"
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-[#0F172A]">68%</span>
            </div>
          </div>

          {/* Stats List */}
          <div className="space-y-2 text-xs">
            {[
              { label: "Autonomous Inbound DMs",  value: "2,460 Chats",  vc: "text-[#0F172A]" },
              { label: "Average Reply Latency",   value: "1.1 Seconds",  vc: "text-[#EA580C]" },
              { label: "Staff Cost Saved (Night)", value: "$450 / month", vc: "text-emerald-700" },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E7EF]">
                <span className="text-slate-500">{s.label}</span>
                <span className={`font-bold tabular-nums ${s.vc}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
