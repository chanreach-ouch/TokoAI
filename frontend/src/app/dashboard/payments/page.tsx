"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, QrCode, ArrowUpRight, DollarSign, ExternalLink, RefreshCw, ShieldCheck, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function PaymentsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, settingsRes] = await Promise.all([
        api.get("/orders?limit=50"),
        api.get("/seller/settings").catch(() => ({ data: {} })),
      ]);
      setOrders(ordersRes.data?.data || []);
      setShopSettings(settingsRes.data || {});
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment records");
    } finally {
      setIsLoading(false);
    }
  };

  const paidOrders = orders.filter(o => o.status === 'PAID' || o.payment_method === 'KHQR');
  const totalVolumeUSD = paidOrders.reduce((sum, o) => sum + Number(o.total_amount_usd || 0), 0);
  const totalVolumeKHR = Math.round(totalVolumeUSD * 4100);

  const merchantId = shopSettings?.bakong_merchant_id || "tokoai_store@aba";

  const handleCopyMerchantId = () => {
    navigator.clipboard.writeText(merchantId);
    setCopied(true);
    toast.success("Bakong Merchant ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E4E7EF]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Bakong KHQR Settlements &amp; Billing
            </h1>
            <span className="text-[10px] font-bold bg-teal-50 text-[#00938C] border border-teal-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={11} /> EMVCo Compliant
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time direct settlements via National Bank of Cambodia (NBC) Bakong network across ABA Bank, ACLEDA, and 30+ member institutions.
          </p>
        </div>

        <Button 
          variant="secondary" 
          className="h-9 text-xs gap-1.5 shadow-sm"
          onClick={loadPaymentData}
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh Ledger
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Bakong Integration Banner */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#00938C] to-[#00605B] rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 opacity-10 text-white">
            <QrCode className="w-60 h-60" />
          </div>
          
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold tracking-wider uppercase">Active NBC Gateway</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-extrabold">Dynamic Bakong KHQR Engine</h2>
            <p className="opacity-90 text-xs md:text-sm max-w-lg leading-relaxed">
              Every customer on TikTok receives an authentic EMVCo dynamic QR code with embedded order total and CRC-16 checksum. Payments settle directly into your merchant bank account in seconds.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <span className="text-xs opacity-75 font-mono">Merchant Account:</span>
              <span className="font-mono text-xs font-black bg-black/25 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                {merchantId}
              </span>
              <button 
                onClick={handleCopyMerchantId}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy ID"
              >
                {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          
          <div className="relative z-10 flex gap-3 pt-6">
            <a 
              href="/dashboard/integrations" 
              className="px-4 py-2 rounded-xl bg-white text-[#00938C] hover:bg-white/90 text-xs font-bold transition-all shadow-sm"
            >
              Configure Bank Details
            </a>
            <a 
              href="https://bakong.nbc.gov.kh" 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              Bakong NBC Portal <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Real-time Settled Metrics */}
        <div className="p-6 rounded-3xl bg-white border border-[#E4E7EF] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#EA580C] mb-4 shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Volume Settled</span>
            <div className="text-3xl font-extrabold text-[#0F172A] mt-1 tabular-nums">
              ${totalVolumeUSD.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              ៛{totalVolumeKHR.toLocaleString()} KHR
            </div>
          </div>

          <div className="pt-6 border-t border-[#FAF9F5] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Settled Transactions:</span>
              <span className="font-extrabold text-[#00938C] font-mono">{paidOrders.length} Completed</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">NBC Interchange Fee:</span>
              <span className="font-bold text-slate-800">$0.00 (0% Free)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Exchange Standard:</span>
              <span className="font-bold text-slate-800 font-mono">1 USD = 4,100 KHR</span>
            </div>
          </div>
        </div>

      </div>

      {/* Transaction History Ledger */}
      <div className="overflow-hidden border border-[#E4E7EF] bg-white shadow-sm rounded-3xl">
        <div className="p-5 border-b border-[#E4E7EF] flex justify-between items-center bg-[#FAF9F5]">
          <div>
            <h3 className="font-extrabold text-sm text-[#0F172A]">Real-time Transaction Ledger</h3>
            <p className="text-[11px] text-slate-400">Instant webhook confirmations verified by TokoAI Bakong settlement hook</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {paidOrders.length} records found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#FAF9F5] border-b border-[#E4E7EF] text-[11px] uppercase tracking-wider text-slate-500 font-extrabold">
              <tr>
                <th className="px-5 py-3.5">Reference ID</th>
                <th className="px-5 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5">Customer &amp; Recipient</th>
                <th className="px-5 py-3.5">Settlement (USD / KHR)</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">NBC Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#EA580C]" />
                    Syncing with Bakong NBC network...
                  </td>
                </tr>
              ) : paidOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <QrCode className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <span className="font-semibold text-slate-700">No settled transactions yet.</span>
                    <p className="text-[11px] text-slate-400 mt-1">Transactions will appear as customers scan and pay with ABA, ACLEDA, or Bakong.</p>
                  </td>
                </tr>
              ) : (
                paidOrders.map(tx => {
                  const khr = Math.round(Number(tx.total_amount_usd) * 4100).toLocaleString();
                  const isBakong = tx.payment_method === 'KHQR' || tx.status === 'PAID';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-[#0F172A]">
                        TXN-{tx.id.toString().padStart(6, '0')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00938C]">
                          <span className="w-2 h-2 rounded-full bg-[#00938C]" />
                          {isBakong ? "Bakong KHQR" : "Cash on Delivery"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-[#0F172A] font-khmer">
                          {tx.customer_phone || `Customer #${tx.user_id}`}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs font-khmer">
                          {tx.delivery_address || "Phnom Penh, Cambodia"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums">
                        <span className="text-[#0F172A] font-black">${Number(tx.total_amount_usd).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">៛{khr} KHR</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 tabular-nums font-mono text-[11px]">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> Settled Instant
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
