"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button, Card, Badge } from "@/components/ui/design-system";
import { TrendingUp, Download, Sparkles, BarChart2, ShieldCheck, Zap } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

const CHART_DATA = [
  { name: 'Mon', aiPilot: 4200, human: 1800 },
  { name: 'Tue', aiPilot: 3800, human: 1200 },
  { name: 'Wed', aiPilot: 5100, human: 950 },
  { name: 'Thu', aiPilot: 4600, human: 1400 },
  { name: 'Fri', aiPilot: 5900, human: 1100 },
  { name: 'Sat', aiPilot: 7200, human: 1600 },
  { name: 'Sun', aiPilot: 8400, human: 2100 },
];

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    total_chats: 0,
    total_products: 0,
    tokens_used: 0,
    total_sales_usd: 0
  });
  const toast = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/seller/analytics');
      setStats(res.data);
    } catch(e) {
      console.error(e);
    }
  };

  const handleDownloadCSV = () => {
    toast.success("Exporting transactions & conversation logs as CSV...");
  };

  const MOCK_STATS = [
    { label: "Conversations Handled", value: stats.total_chats.toLocaleString(), trend: "+14.8%", isPositive: true },
    { label: "Active AI Catalog SKUs", value: stats.total_products.toLocaleString(), trend: "+4.1%", isPositive: true },
    { label: "AI-Closed Revenue", value: `$${stats.total_sales_usd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, trend: "+28.4%", isPositive: true },
    { label: "AI Tokens Invested", value: stats.tokens_used.toLocaleString(), trend: "-6.2% efficiency", isPositive: true },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Performance & Revenue Analytics
            </h1>
            <Badge variant="brand" className="text-[10px]">Attribution Engine</Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time attribution comparing autonomous AI closed revenue vs. manual admin staff replies.
          </p>
        </div>
        <Button variant="secondary" className="h-9 text-xs gap-1.5 shadow-sm" onClick={handleDownloadCSV}>
          <Download size={13} /> Export Report (CSV)
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_STATS.map((stat, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between gap-3 border border-slate-200/80 bg-white hover:border-slate-300 shadow-sm transition-all rounded-2xl">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
            <h3 className="text-3xl font-black text-[#0F172A] tracking-tight tabular-nums">{stat.value}</h3>
            <div className="flex items-center text-xs">
              <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                stat.isPositive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60' : 'text-rose-700 bg-rose-50 border border-rose-200/60'
              }`}>
                {stat.trend}
              </span>
              <span className="text-slate-400 text-[11px] ml-2 font-medium">vs previous 30 days</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart Section */}
      <Card className="p-6 h-[440px] flex flex-col border border-slate-200/80 bg-white shadow-sm rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#EA580C]">
              <BarChart2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Revenue Attribution: AI Auto-Pilot vs Human Admin</h3>
              <p className="text-[11px] text-slate-500">Weekly sales distribution generated via TikTok Business DM webhooks</p>
            </div>
          </div>
          <Badge variant="bakong" className="text-[10px]">Bakong Verified</Badge>
        </div>

        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value: any) => `$${(value/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#E2E8F0', 
                  color: '#0F172A', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#0F172A', fontWeight: 600 }}
                cursor={{ fill: 'rgba(234,88,12,0.04)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '11px', color: '#64748B' }} />
              <Bar dataKey="aiPilot" name="AI Auto-Pilot ($)" stackId="a" fill="#EA580C" radius={[0, 0, 4, 4]} />
              <Bar dataKey="human"   name="Human Admin ($)"   stackId="a" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
