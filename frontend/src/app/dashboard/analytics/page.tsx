"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button, Card } from "@/components/ui/design-system";
import api from "@/lib/api";

const CHART_DATA = [
  { name: 'Mon', aiPilot: 4000, human: 2400 },
  { name: 'Tue', aiPilot: 3000, human: 1398 },
  { name: 'Wed', aiPilot: 2000, human: 9800 },
  { name: 'Thu', aiPilot: 2780, human: 3908 },
  { name: 'Fri', aiPilot: 1890, human: 4800 },
  { name: 'Sat', aiPilot: 2390, human: 3800 },
  { name: 'Sun', aiPilot: 3490, human: 4300 },
];

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    total_chats: 0,
    total_products: 0,
    tokens_used: 0,
    total_sales_usd: 0
  });

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

  const MOCK_STATS = [
    { label: "Conversations Handled", value: stats.total_chats.toLocaleString(), trend: "+12.5%", isPositive: true },
    { label: "Active AI Products", value: stats.total_products.toLocaleString(), trend: "+3.2%", isPositive: true },
    { label: "AI-Closed Revenue", value: `$${stats.total_sales_usd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, trend: "+24.1%", isPositive: true },
    { label: "Tokens Burned", value: stats.tokens_used.toLocaleString(), trend: "-5.4%", isPositive: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Analytics</h2>
          <p className="text-sm text-zinc-500 mt-1">Live metrics pulled from /api/v1/seller/analytics</p>
        </div>
        <Button variant="secondary" className="h-8">Download CSV</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MOCK_STATS.map((stat, i) => (
          <Card key={i} className="p-5 flex flex-col gap-3">
            <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
            <h3 className="text-3xl font-semibold text-white tracking-tight tabular-nums">{stat.value}</h3>
            <div className="flex items-center text-xs">
              <span className={`font-medium ${stat.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.trend}
              </span>
              <span className="text-zinc-600 ml-2">from last month</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 h-[400px] flex flex-col">
        <h3 className="text-sm font-medium text-white mb-6">Revenue: AI Auto-Pilot vs Human Takeover</h3>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: any) => `$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ fill: '#111' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#888' }} />
              <Bar dataKey="aiPilot" name="AI Auto-Pilot" stackId="a" fill="#fff" radius={[0, 0, 4, 4]} />
              <Bar dataKey="human" name="Human Takeover" stackId="a" fill="#333" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
