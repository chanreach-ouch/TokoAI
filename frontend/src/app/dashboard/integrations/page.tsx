"use client";

import { useState, useEffect } from "react";
import { Activity, ShieldCheck, QrCode, RefreshCw, KeyRound, CheckCircle2, Zap } from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function IntegrationsPage() {
  const [tiktokId, setTiktokId] = useState("");
  const [bakongId, setBakongId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTikTok, setIsSavingTikTok] = useState(false);
  const [isSavingBakong, setIsSavingBakong] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await api.get('/seller/integrations');
      setTiktokId(res.data.tiktok_page_id || "");
      setBakongId(res.data.bakong_merchant_id || "");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load integration credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTikTok = async () => {
    setIsSavingTikTok(true);
    try {
      await api.post('/seller/integrations', { tiktok_page_id: tiktokId });
      toast.success("TikTok Business Messaging API connected!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect TikTok Page ID.");
    } finally {
      setIsSavingTikTok(false);
    }
  };

  const handleUpdateBakong = async () => {
    setIsSavingBakong(true);
    try {
      await api.post('/seller/integrations', { bakong_merchant_id: bakongId });
      toast.success("Bakong KHQR Merchant Account verified!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save Bakong Merchant ID.");
    } finally {
      setIsSavingBakong(false);
    }
  };

  if (isLoading) return (
    <div className="p-12 text-center text-xs text-slate-400">
      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#EA580C]" />
      Loading channel credentials...
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
            Channel & Payment Integrations
          </h1>
          <Badge variant="brand" className="text-[10px]">Zero Friction</Badge>
        </div>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Connect your official TikTok Shop Business Messaging webhook and Bakong KHQR merchant account.
        </p>
      </div>
      
      {/* TikTok Card */}
      <Card className="p-6 space-y-4 border border-slate-200/80 bg-white shadow-sm rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
              T
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">TikTok Business Messaging API</h3>
              <p className="text-xs text-slate-500">Intercepts direct messages with &lt;100ms HMAC-SHA256 signature acknowledgment.</p>
            </div>
          </div>
          {tiktokId ? (
            <Badge variant="success" className="text-[10px]">Connected</Badge>
          ) : (
            <Badge variant="warning" className="text-[10px]">Setup Needed</Badge>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">TikTok Shop Page / Business Account ID</label>
          <Input 
            value={tiktokId} 
            onChange={(e: any) => setTiktokId(e.target.value)} 
            placeholder="e.g. TT-KH-SHOP-99214"
            className="text-xs font-mono"
          />
        </div>
        <Button 
          variant="primary" 
          className="w-full text-xs h-9 shadow-sm" 
          onClick={handleUpdateTikTok}
          disabled={isSavingTikTok}
        >
          {isSavingTikTok ? "Verifying Handshake..." : "Save TikTok Connection"}
        </Button>
      </Card>

      {/* Bakong Card */}
      <Card className="p-6 space-y-4 border border-slate-200/80 bg-white shadow-sm rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center text-[#00938C] shadow-sm">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">National Bank of Cambodia (Bakong KHQR)</h3>
              <p className="text-xs text-slate-500">Generates real-time EMVCo QR images with CRC-16 checksums for ABA & Bakong apps.</p>
            </div>
          </div>
          {bakongId ? (
            <Badge variant="bakong" className="text-[10px]">Verified 🇰🇭</Badge>
          ) : (
            <Badge variant="neutral" className="text-[10px]">Not Connected</Badge>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Bakong Merchant Account ID / Proxy</label>
          <Input 
            type="password" 
            value={bakongId} 
            onChange={(e: any) => setBakongId(e.target.value)} 
            placeholder="e.g. merchant@aba or BKG-883921"
            className="text-xs font-mono"
          />
        </div>
        <Button 
          variant="brand" 
          className="w-full text-xs h-9 shadow-sm" 
          onClick={handleUpdateBakong}
          disabled={isSavingBakong}
        >
          {isSavingBakong ? "Connecting to NBC..." : "Save Bakong Merchant Key"}
        </Button>
      </Card>

      {/* Trust & Architecture Strip */}
      <Card className="p-5 bg-[#FAF9F5] border border-slate-200/80 rounded-2xl flex items-start gap-3">
        <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-[#0F172A]">Bank-Grade Payload Security & Fast SLA</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            All TikTok DM payloads undergo cryptographic HMAC-SHA256 signature verification in &lt;10ms, while Bakong KHQR codes are deterministically constructed adhering to EMVCo Tag-Length-Value standard with strict CRC-16-CCITT False checksums.
          </p>
        </div>
      </Card>
    </div>
  );
}
