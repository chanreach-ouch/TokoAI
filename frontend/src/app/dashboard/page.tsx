"use client";

import { useState, useEffect } from "react";
import {
  Sparkles, TrendingUp, TrendingDown, ArrowRight, Download,
  Package, ShoppingBag, CheckCircle2, AlertCircle, Clock,
  ChevronDown, ExternalLink, RefreshCw, FileText, Share2,
  Users, MessageSquare, Zap, Check, Copy, X
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>({
    total_sales_usd: 54143.00,
    total_chats: 214,
    total_products: 48,
    tokens_used: 8200
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, ordersRes, productsRes] = await Promise.all([
        api.get('/seller/analytics').catch(() => ({ data: {} })),
        api.get('/orders?limit=6').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: [] }))
      ]);

      const analyticsData = analyticsRes.data || {};
      const ordersList = ordersRes.data?.data || [];
      const prodList = productsRes.data || [];

      if (analyticsData.total_sales_usd > 0) {
        setAnalytics({
          total_sales_usd: Number(analyticsData.total_sales_usd || 0),
          total_chats: Number(analyticsData.total_chats || 0),
          total_products: Number(analyticsData.total_products || prodList.length || 0),
          tokens_used: Number(analyticsData.tokens_used || 0)
        });
      }

      setRecentOrders(ordersList);
      setProducts(prodList);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInvite = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) { navigator.clipboard.writeText("https://tokoai.com/invite/merchant-kh"); }
    setCopiedLink(true);
    toast.success("Affiliate invite link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const revenueUSD = analytics.total_sales_usd || 54143.00;
  const revenueKHR = Math.round(revenueUSD * 4100).toLocaleString();

  // Mock top products for table if empty
  const displayProducts = products.length > 0 ? products.slice(0, 5) : [
    {
      id: "1",
      name: "Oversized Streetwear Tee (Black)",
      category: "Fashion & Apparel",
      stock: 220,
      price: 12.00,
      status: "Active",
      image_url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "2",
      name: "Glow Vitamin C Brightening Serum",
      category: "Skincare & Beauty",
      stock: 50,
      price: 18.50,
      status: "Active",
      image_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "3",
      name: "Minimalist Leather Crossbody Bag",
      category: "Accessories",
      stock: 5,
      price: 25.00,
      status: "Low Stock",
      image_url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=200&auto=format&fit=crop"
    },
    {
      id: "4",
      name: "Vintage Distressed Denim Jacket",
      category: "Outerwear",
      stock: 0,
      price: 34.00,
      status: "Sold Out",
      image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=200&auto=format&fit=crop"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* ── Top Announcement Banner (Matching Rubick Template) ── */}
      {showUpdateBanner && (
        <div className="bg-[#1B38A6] rounded-2xl px-5 py-3 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 text-xs">
            <span className="bg-white/20 text-white font-extrabold px-2 py-0.5 rounded-full text-[10px]">
              NEW UPDATE
            </span>
            <span className="font-medium text-blue-100">
              TokoAI Autonomous Commerce Engine v2.0 is live! Automated Midnight Order Rescue on TikTok Shop.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/ai-setup" 
              className="text-xs font-bold text-white hover:text-blue-200 flex items-center gap-1 shrink-0 transition-colors"
            >
              Explore AI Playground <ArrowRight size={13} />
            </Link>
            <button
              onClick={() => setShowUpdateBanner(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-blue-200 hover:text-white transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Row 1: General Report + Realtime Active Chats + AI Donut ── */}
      <div className="grid grid-cols-12 gap-6">

        {/* 1. General Financial Report Card (Left - col 12/lg:6) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                General Report
              </h2>
              <div className="flex items-center bg-slate-100 rounded-full p-0.5 text-[11px] font-bold text-slate-600">
                <button 
                  onClick={() => setTimeframe("daily")}
                  className={`px-3 py-1 rounded-full transition-all ${timeframe === "daily" ? "bg-white text-[#1B38A6] shadow-xs" : "hover:text-slate-900"}`}
                >
                  Daily
                </button>
                <button 
                  onClick={() => setTimeframe("weekly")}
                  className={`px-3 py-1 rounded-full transition-all ${timeframe === "weekly" ? "bg-white text-[#1B38A6] shadow-xs" : "hover:text-slate-900"}`}
                >
                  Weekly
                </button>
                <button 
                  onClick={() => setTimeframe("monthly")}
                  className={`px-3 py-1 rounded-full transition-all ${timeframe === "monthly" ? "bg-white text-[#1B38A6] shadow-xs" : "hover:text-slate-900"}`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Big Revenue Figure */}
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-xs">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#0F172A] tracking-tight tabular-nums">
                      ${revenueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200/70 flex items-center gap-0.5">
                      +47% <TrendingUp size={11} />
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    ≈ ៛{revenueKHR} KHR (NBC Rate)
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                  Sales earnings this month after associated author and TikTok Shop commission fees, before taxes.
                </p>
                <button 
                  onClick={() => toast.info("Exporting monthly earnings ledger (PDF)...")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-full text-xs font-bold transition-all shadow-xs"
                >
                  Download Reports <ArrowRight size={13} className="text-[#1B38A6]" />
                </button>
              </div>

              {/* Right Column: Key Sub-Metrics (Rubick Template Column) */}
              <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Transactions</div>
                  <div className="text-sm font-extrabold text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                    4,501 <span className="text-[10px] text-rose-500 font-semibold flex items-center">2% <TrendingDown size={10} /></span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Midnight Rescues (10PM-2AM)</div>
                  <div className="text-sm font-extrabold text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                    214 Orders <span className="text-[10px] text-emerald-600 font-semibold flex items-center">12% <TrendingUp size={10} /></span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Sales Value</div>
                  <div className="text-sm font-extrabold text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                    $72,000.00 <span className="text-[10px] text-emerald-600 font-semibold flex items-center">49% <TrendingUp size={10} /></span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Sales Profit</div>
                  <div className="text-sm font-extrabold text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                    $54,000.00 <span className="text-[10px] text-emerald-600 font-semibold flex items-center">52% <TrendingUp size={10} /></span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer CRM Directory</div>
                  <div className="text-sm font-extrabold text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                    2,500 Buyers <span className="text-[10px] text-emerald-600 font-semibold flex items-center">55% <TrendingUp size={10} /></span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 2. Realtime Active Chats / Telemetry Card (Middle - col 12/lg:3) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Realtime Activity</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="pt-4 space-y-1">
              <div className="text-2xl font-black text-[#0F172A] tracking-tight tabular-nums">
                214
              </div>
              <div className="text-[11px] text-slate-400">
                Inbound DMs per hour · <span className="text-emerald-600 font-bold">+49%</span>
              </div>
            </div>

            {/* Visual Simulated Activity Chart */}
            <div className="pt-4 pb-2">
              <div className="flex items-end gap-1.5 h-16 w-full">
                <div className="flex-1 bg-blue-100 rounded-t-sm h-[35%]" />
                <div className="flex-1 bg-blue-200 rounded-t-sm h-[55%]" />
                <div className="flex-1 bg-blue-100 rounded-t-sm h-[40%]" />
                <div className="flex-1 bg-[#1B38A6] rounded-t-sm h-[90%]" />
                <div className="flex-1 bg-blue-300 rounded-t-sm h-[70%]" />
                <div className="flex-1 bg-blue-200 rounded-t-sm h-[45%]" />
                <div className="flex-1 bg-[#1B38A6] rounded-t-sm h-[100%]" />
                <div className="flex-1 bg-blue-300 rounded-t-sm h-[65%]" />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 pt-1 font-mono">
                <span>10 PM</span>
                <span>Midnight (Peak)</span>
                <span>2 AM</span>
              </div>
            </div>

            {/* Top Inquired Products List */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50">
                <span className="text-slate-600 truncate max-w-[140px]">Streetwear Tee</span>
                <span className="font-mono font-bold text-slate-900">472 DMs</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50">
                <span className="text-slate-600 truncate max-w-[140px]">Vitamin C Serum</span>
                <span className="font-mono font-bold text-slate-900">294 DMs</span>
              </div>
              <div className="flex items-center justify-between text-[11px] py-1">
                <span className="text-slate-600 truncate max-w-[140px]">Crossbody Bag</span>
                <span className="font-mono font-bold text-slate-900">83 DMs</span>
              </div>
            </div>
          </div>

          <Link href="/dashboard/inbox" className="pt-4">
            <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#1B38A6] rounded-xl text-xs font-bold transition-colors border border-slate-200/80">
              Live Inbox Stream →
            </button>
          </Link>
        </div>

        {/* 3. AI Autopilot vs Human Resolution Donut Card (Right - col 12/lg:3) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Autonomy</h3>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-full text-[10px] font-bold">
                <span className="px-2 py-0.5 bg-white text-[#1B38A6] rounded-full shadow-xs">Active</span>
                <span className="px-2 py-0.5 text-slate-400">Total</span>
              </div>
            </div>

            {/* Donut Graphic Visualizer */}
            <div className="pt-5 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Simulated SVG Donut Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Autonomous AI Segment (84%) */}
                  <path
                    className="text-[#1B38A6]"
                    strokeDasharray="84, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-[#0F172A] tracking-tight">84%</span>
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Autonomous</span>
                </div>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-2 pt-5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1B38A6]" />
                  <span className="text-slate-600">AI Autonomous Closed</span>
                </div>
                <span className="font-bold text-[#0F172A]">84%</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600">Human Escalation</span>
                </div>
                <span className="font-bold text-[#0F172A]">16%</span>
              </div>
            </div>
          </div>

          <Link href="/dashboard/settings" className="pt-4">
            <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200/80">
              Bot Tone Settings →
            </button>
          </Link>
        </div>

      </div>

      {/* ── Row 2: Dual Action Banners (Matching Rubick Template) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Banner 1: Deep Blue Midnight Engine */}
        <div className="bg-gradient-to-r from-[#1B38A6] to-blue-700 rounded-3xl p-6 text-white shadow-md flex items-center justify-between gap-6 relative overflow-hidden group">
          <div className="space-y-3 z-10 max-w-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20">
              Autonomous AI Copilot
            </span>
            <h3 className="text-lg font-black tracking-tight text-white leading-snug">
              Midnight Order Drop-Off Rescue Engine
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              TokoAI automatically responds to impulsive TikTok buyers between 10 PM and 2 AM in natural spoken Khmer, saving 35% of lost midnight sales.
            </p>
            <div className="pt-1">
              <Link href="/dashboard/ai-setup">
                <button className="px-5 py-2.5 bg-white text-[#1B38A6] hover:bg-blue-50 rounded-full text-xs font-extrabold transition-all shadow-sm">
                  Test AI Responses Now
                </button>
              </Link>
            </div>
          </div>

          {/* Decorative Sparkle Art */}
          <div className="hidden sm:flex w-24 h-24 rounded-full bg-white/10 items-center justify-center shrink-0 border border-white/15">
            <Zap size={44} className="text-amber-300 fill-amber-300/30" />
          </div>
        </div>

        {/* Banner 2: Clean White Bakong & Invite Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Zero Payment Friction
            </span>
            <h3 className="text-lg font-black tracking-tight text-[#0F172A]">
              Instant Bakong KHQR Settlement
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Auto-generates EMVCo CRC-16 checksum QR codes for ABA Mobile and Bakong app scanning. Zero manual screenshot checking needed.
            </p>
            
            {/* 1-Tap Copy Invite Link */}
            <div className="pt-1 flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-600 truncate border border-slate-200">
                https://tokoai.com/invite/merchant-kh
              </div>
              <button
                onClick={handleCopyInvite}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                title="Copy Link"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#00938C] shrink-0 shadow-xs">
            <CheckCircle2 size={36} />
          </div>
        </div>

      </div>

      {/* ── Row 3: Weekly Top Products Table (Rubick Template Composition) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
              Top Selling Catalog Products
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live inventory synced with Gemini vector embeddings and variant stocks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => toast.info("Exporting products to Excel...")}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText size={13} /> Export to Excel
            </button>
            <Link href="/dashboard/knowledge-base">
              <button className="px-4 py-1.5 rounded-full bg-[#1B38A6] hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-xs">
                Manage Catalog
              </button>
            </Link>
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Images</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stock Units</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayProducts.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={p.image_url || "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=200&auto=format&fit=crop"} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                    <div className="truncate max-w-xs">{p.name_kh || p.name}</div>
                    <div className="text-[10px] font-mono text-[#1B38A6] mt-0.5">${Number(p.price).toFixed(2)}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {p.category || "General Merchandise"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A]">
                    {p.stock}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      p.stock > 10 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : p.stock > 0 
                          ? "bg-amber-50 text-amber-700 border border-amber-200" 
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 10 ? "bg-emerald-500" : p.stock > 0 ? "bg-amber-500" : "bg-rose-500"}`} />
                      {p.stock > 10 ? "In Stock" : p.stock > 0 ? "Low Stock" : "Sold Out"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href="/dashboard/knowledge-base">
                      <button className="text-xs font-bold text-[#1B38A6] hover:underline px-2 py-1">
                        Edit
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── Row 4: Recent Orders Dispatch & Financial Ledger ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Orders Dispatch Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-[#0F172A]">Recent Orders Awaiting Dispatch</h3>
              <p className="text-[11px] text-slate-500">1-tap waybills for J&T Express &amp; Virak Buntham VET.</p>
            </div>
            <Link href="/dashboard/orders" className="text-xs font-bold text-[#1B38A6] hover:underline">
              View All Orders →
            </Link>
          </div>

          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                No orders pending dispatch. Autonomous bot is ready to close sales on TikTok Shop!
              </div>
            ) : (
              recentOrders.slice(0, 4).map((o: any) => (
                <div key={o.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold text-[#0F172A] truncate">
                      Order #{o.id} · {o.items?.name || "Retail Merchandise"}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>{o.customer_phone || "012 345 678"}</span>
                      <span>·</span>
                      <span className="text-[#1B38A6] font-bold font-mono">${Number(o.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                  <Link href="/dashboard/orders">
                    <button className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs shrink-0">
                      Print 4x6" Waybill
                    </button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Bakong Settlement Ledger */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-[#0F172A]">NBC Bakong Live Settlements</h3>
              <p className="text-[11px] text-slate-500">Real-time mobile banking transactions (ABA &amp; Bakong).</p>
            </div>
            <Link href="/dashboard/payments" className="text-xs font-bold text-[#1B38A6] hover:underline">
              Full Ledger →
            </Link>
          </div>

          <div className="space-y-2.5">
            {[
              { id: "TX-9201", customer: "Sophea Meng", time: "2 mins ago", method: "ABA Mobile KHQR", amount: "+$24.00" },
              { id: "TX-9200", customer: "Vannak Keo", time: "18 mins ago", method: "Bakong KHQR", amount: "+$18.50" },
              { id: "TX-9199", customer: "Channary Pich", time: "42 mins ago", method: "Cash on Delivery", amount: "+$35.00" },
              { id: "TX-9198", customer: "Dara Rath", time: "1 hour ago", method: "ABA Mobile KHQR", amount: "+$12.00" }
            ].map(tx => (
              <div key={tx.id} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs transition-colors shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    $
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A]">{tx.customer}</div>
                    <div className="text-[10px] text-slate-400">{tx.time} · {tx.method}</div>
                  </div>
                </div>
                <div className="font-mono font-black text-emerald-600 tabular-nums">
                  {tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
