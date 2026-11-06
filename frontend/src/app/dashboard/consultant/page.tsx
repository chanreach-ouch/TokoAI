"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import {
  Bot, Sparkles, AlertTriangle, TrendingUp, DollarSign,
  Package, ArrowUpRight, Send, RefreshCw, BarChart2,
  CheckCircle2, Clock, ShieldCheck, ChevronRight
} from "lucide-react";

interface ProductForecast {
  product_id: string;
  sku: string;
  name: string;
  current_stock: number;
  retail_price_usd: number;
  cost_price_usd: number;
  min_negotiation_price: number;
  unit_margin_usd: number;
  unit_margin_pct: number;
  daily_velocity: number;
  units_sold_30d: number;
  days_until_stockout: number;
  stock_status: string;
  recommended_reorder_qty: number;
}

interface BIPnLSummary {
  gross_revenue_usd: number;
  gross_revenue_khr: number;
  total_cogs_usd: number;
  gross_profit_usd: number;
  gross_margin_pct: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "advisor";
  content: string;
  toolCalled?: string;
  data?: any;
}

export default function ConsultantPage() {
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState<ProductForecast[]>([]);
  const [pnl, setPnl] = useState<BIPnLSummary>({
    gross_revenue_usd: 0,
    gross_revenue_khr: 0,
    total_cogs_usd: 0,
    gross_profit_usd: 0,
    gross_margin_pct: 0
  });
  const [criticalCount, setCriticalCount] = useState(0);
  const [dropOffs, setDropOffs] = useState({ cart_abandoned: 0, payment_pending: 0, bargain_exit: 0 });

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "advisor",
      content: "ជម្រាបសួរលោកអ្នក! ខ្ញុំជា TokoAI Business & Sales Advisor សម្រាប់ហាងរបស់អ្នក។ ខ្ញុំបានវិភាគលើទិន្នន័យលក់ និងស្តុកជាក់ស្តែង។ តើអ្នកចង់ឱ្យខ្ញុំជួយពិនិត្យមើលស្តុកជិតដាច់ (Stockout) ឬប្រាក់ចំណេញ (P&L Margin) ដែរទេ?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBIData();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchBIData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/seller/analytics/business-intelligence");
      if (res.data) {
        setForecasts(res.data.products_forecast || []);
        setPnl(res.data.pnl_summary || {});
        setCriticalCount(res.data.critical_stockouts_count || 0);
        setDropOffs(res.data.drop_off_metrics || { cart_abandoned: 0, payment_pending: 0, bargain_exit: 0 });
      }
    } catch (err) {
      console.error("Failed to load BI data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text
    };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setSending(true);

    try {
      const res = await api.post("/consultant/chat", { message: text });
      const advisorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "advisor",
        content: res.data.reply || "Analysis complete.",
        toolCalled: res.data.tool_called,
        data: res.data.data
      };
      setChatMessages(prev => [...prev, advisorMsg]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "advisor",
          content: "សុំទោសបង ពេលនេះប្រព័ន្ធប្រឹក្សាយោបល់កំពុងរវល់បន្តិច សូមសាកល្បងសួរម្ដងទៀតណា៎បង!"
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F1F5F9]">
      {/* Top Header */}
      <div className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-[#1B38A6] rounded-xl border border-blue-100">
            <Bot size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              Executive AI Consultant & Predictive BI
              <span className="text-[10px] bg-blue-100 text-[#1B38A6] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                PRO ACTIVE
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium font-khmer">
              ប្រព័ន្ធវិភាគស្តុក ព្យាករណ៍ការដាច់ស្តុក និងទីប្រឹក្សាយុទ្ធសាស្ត្រលក់ស្វ័យប្រវត្ត
            </p>
          </div>
        </div>

        <button
          onClick={fetchBIData}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Intelligence
        </button>
      </div>

      {/* Main Split Layout: Left BI Dashboard, Right AI Consultant Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Real-Time BI & Stockout Forecasting */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Critical Stockouts Alert */}
            <div className={`p-5 rounded-2xl border ${criticalCount > 0 ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-slate-200/80'} shadow-xs`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Restock</span>
                <div className={`p-2 rounded-xl ${criticalCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                {criticalCount} <span className="text-xs font-bold text-slate-500">SKUs</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium font-khmer">
                {criticalCount > 0 ? "ទំនិញជិតអស់ក្នុងរយៈពេល ≤ ៥ ថ្ងៃ" : "ស្តុកទាំងអស់ស្ថិតក្នុងកម្រិតសុវត្ថិភាព"}
              </p>
            </div>

            {/* Gross Revenue */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                ${pnl.gross_revenue_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                {pnl.gross_revenue_khr.toLocaleString()} ៛ (Past 30 Days)
              </p>
            </div>

            {/* Total COGS & Margin */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Profit (Margin)</span>
                <div className="p-2 rounded-xl bg-blue-50 text-[#1B38A6]">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                ${pnl.gross_profit_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">
                {pnl.gross_margin_pct}% Gross Margin (COGS: ${pnl.total_cogs_usd.toFixed(0)})
              </p>
            </div>

            {/* Drop-Off Health */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Checkout Health</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <BarChart2 size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
                {dropOffs.payment_pending} <span className="text-xs font-bold text-slate-500">Unpaid QR</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                {dropOffs.bargain_exit} Negotiated Exits | {dropOffs.cart_abandoned} Stalled
              </p>
            </div>
          </div>

          {/* Predictive SKU Stockout Forecast Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Automated SKU Restock Forecast</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Predicts days until depletion based on daily sales velocity
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {forecasts.length} Products Monitored
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-6">Product / SKU</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Sales Velocity</th>
                    <th className="py-3 px-4">Unit Margin</th>
                    <th className="py-3 px-4">Depletion Forecast</th>
                    <th className="py-3 px-4">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {forecasts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                        No product data yet. Add products to activate predictive intelligence.
                      </td>
                    </tr>
                  ) : (
                    forecasts.map(f => (
                      <tr key={f.product_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900 text-xs font-khmer">{f.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{f.sku}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {f.current_stock} units
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{f.daily_velocity} / day</div>
                          <div className="text-[10px] text-slate-400">{f.units_sold_30d} sold (30d)</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-emerald-600">${f.unit_margin_usd.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-400">{f.unit_margin_pct}% margin</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          {f.days_until_stockout <= 5.0 && f.current_stock > 0 ? (
                            <span className="text-amber-600 flex items-center gap-1">
                              <AlertTriangle size={13} /> {f.days_until_stockout} days left
                            </span>
                          ) : f.current_stock === 0 ? (
                            <span className="text-rose-600">0 days (Out of Stock)</span>
                          ) : (
                            <span className="text-slate-600">{f.days_until_stockout} days left</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {f.stock_status === "CRITICAL_RESTOCK" && (
                            <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[10px] border border-amber-200">
                              Order +{f.recommended_reorder_qty} units
                            </span>
                          )}
                          {f.stock_status === "OUT_OF_STOCK" && (
                            <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full text-[10px] border border-rose-200">
                              Restock Urgently
                            </span>
                          )}
                          {f.stock_status === "HEALTHY" && (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Healthy
                            </span>
                          )}
                          {f.stock_status === "LOW_VELOCITY" && (
                            <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Low Velocity
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: AI Executive Advisor Chat Console */}
        <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-sm">
          {/* Advisor Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1B38A6] text-white flex items-center justify-center shadow-xs">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">TokoAI Executive Advisor</h3>
                <p className="text-[10px] text-slate-500 font-medium">Real-Time Autonomous Store Consultant</p>
              </div>
            </div>
          </div>

          {/* Quick Questions Pills */}
          <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-[11px] font-medium no-scrollbar">
            <button
              onClick={() => handleSendMessage("What items will run out of stock this week?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-[#1B38A6] transition-colors cursor-pointer"
            >
              ⚠️ Low Stock Check
            </button>
            <button
              onClick={() => handleSendMessage("What is my gross profit margin and revenue?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-[#1B38A6] transition-colors cursor-pointer"
            >
              💵 P&L Margin
            </button>
            <button
              onClick={() => handleSendMessage("Why are customers dropping off before paying?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:text-[#1B38A6] transition-colors cursor-pointer"
            >
              📉 Drop-Off Audit
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {msg.toolCalled && (
                  <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-[#1B38A6] bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                    <Sparkles size={10} /> Executed tool: {msg.toolCalled}
                  </div>
                )}
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed font-khmer ${
                    msg.role === "user"
                      ? "bg-[#1B38A6] text-white rounded-br-xs"
                      : "bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60 font-medium"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium p-2">
                <RefreshCw size={12} className="animate-spin text-[#1B38A6]" />
                TokoAI is analyzing real-time store metrics...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask advice on restocks, pricing, margins... (Khmer / English)"
                className="flex-1 text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#1B38A6] text-slate-800 font-khmer placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="p-2.5 bg-[#1B38A6] text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
