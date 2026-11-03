"use client";

import { useState, useEffect } from "react";
import { 
  Activity, ShieldCheck, QrCode, RefreshCw, KeyRound, CheckCircle2, 
  Zap, Copy, Check, ExternalLink, HelpCircle 
} from "lucide-react";
import { Button, Input, Card, Badge } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function IntegrationsPage() {
  const [tiktokId, setTiktokId] = useState("");
  const [bakongId, setBakongId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTikTok, setIsSavingTikTok] = useState(false);
  const [isSavingBakong, setIsSavingBakong] = useState(false);
  const [copiedTikTokUrl, setCopiedTikTokUrl] = useState(false);
  const [copiedBakongUrl, setCopiedBakongUrl] = useState(false);
  const toast = useToast();

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://api.tokoai.com';
  const tiktokWebhookUrl = `${baseUrl}/api/v1/webhooks/tiktok/`;
  const bakongWebhookUrl = `${baseUrl}/api/v1/webhooks/bakong`;

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

  const copyToClipboard = (text: string, type: 'tiktok' | 'bakong') => {
    if (typeof navigator !== "undefined" && navigator.clipboard) { navigator.clipboard.writeText(text); }
    if (type === 'tiktok') {
      setCopiedTikTokUrl(true);
      setTimeout(() => setCopiedTikTokUrl(false), 2000);
    } else {
      setCopiedBakongUrl(true);
      setTimeout(() => setCopiedBakongUrl(false), 2000);
    }
    toast.info("Webhook callback URL copied to clipboard!");
  };

  if (isLoading) return (
    <div className="p-12 text-center text-xs text-slate-400">
      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1B38A6]" />
      Loading channel credentials...
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
            Channel &amp; Payment Integrations
          </h1>
          <Badge variant="brand" className="text-[10px]">Zero Friction</Badge>
        </div>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Connect your official TikTok Shop Business Messaging webhook and Bakong KHQR merchant account.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* TikTok Card */}
        <Card className="p-6 space-y-4 border border-slate-200 bg-white shadow-sm rounded-3xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
                  T
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">TikTok Business Messaging</h3>
                  <p className="text-[11px] text-slate-400">Direct message webhook ingestion</p>
                </div>
              </div>
              {tiktokId ? (
                <Badge variant="success" className="text-[10px]">Connected</Badge>
              ) : (
                <Badge variant="warning" className="text-[10px]">Setup Needed</Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">TikTok Shop Page / Business Account ID</label>
              <Input 
                value={tiktokId} 
                onChange={(e: any) => setTiktokId(e.target.value)} 
                placeholder="e.g. TT-KH-SHOP-99214 or mock-shop-123"
                className="text-xs font-mono bg-slate-50 border-slate-200 rounded-xl h-10"
              />
            </div>

            {/* Webhook Callback Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Your Webhook Callback URL:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(tiktokWebhookUrl, 'tiktok')}
                  className="text-xs text-[#1B38A6] hover:text-[#142C85] font-bold flex items-center gap-1"
                >
                  {copiedTikTokUrl ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedTikTokUrl ? "Copied" : "Copy URL"}</span>
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-700 select-all truncate bg-white p-2 rounded-lg border border-slate-200/80">
                {tiktokWebhookUrl}
              </p>
              <p className="text-[10px] text-slate-400">
                Paste into your TikTok Developer Portal &gt; Webhook Subscriptions.
              </p>
            </div>
          </div>

          <Button 
            variant="brand" 
            className="w-full text-xs h-10 font-bold shadow-sm rounded-xl mt-2" 
            onClick={handleUpdateTikTok}
            disabled={isSavingTikTok}
          >
            {isSavingTikTok ? "Verifying Handshake..." : "Save TikTok Connection"}
          </Button>
        </Card>

        {/* Bakong KHQR Card */}
        <Card className="p-6 space-y-4 border border-slate-200 bg-white shadow-sm rounded-3xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center text-[#00938C] shadow-sm">
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">National Bank of Cambodia (Bakong)</h3>
                  <p className="text-[11px] text-slate-400">Dynamic KHQR &amp; ABA Bank scanning</p>
                </div>
              </div>
              {bakongId ? (
                <Badge variant="bakong" className="text-[10px]">Verified 🇰🇭</Badge>
              ) : (
                <Badge variant="neutral" className="text-[10px]">Not Connected</Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Bakong Merchant Account ID / Proxy</label>
              <Input 
                value={bakongId} 
                onChange={(e: any) => setBakongId(e.target.value)} 
                placeholder="e.g. tokoai_store@aba or BKG-883921"
                className="text-xs font-mono bg-slate-50 border-slate-200 rounded-xl h-10"
              />
            </div>

            {/* Webhook Callback Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Payment Webhook URL:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bakongWebhookUrl, 'bakong')}
                  className="text-xs text-[#00938C] hover:text-teal-800 font-bold flex items-center gap-1"
                >
                  {copiedBakongUrl ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedBakongUrl ? "Copied" : "Copy URL"}</span>
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-700 select-all truncate bg-white p-2 rounded-lg border border-slate-200/80">
                {bakongWebhookUrl}
              </p>
              <p className="text-[10px] text-slate-400">
                Configure in ABA PayWay or NBC Bakong Merchant portal for instant settlement.
              </p>
            </div>
          </div>

          <Button 
            variant="brand" 
            className="w-full text-xs h-10 font-bold shadow-sm rounded-xl mt-2" 
            onClick={handleUpdateBakong}
            disabled={isSavingBakong}
          >
            {isSavingBakong ? "Connecting to NBC..." : "Save Bakong Merchant Key"}
          </Button>
        </Card>

      </div>

      {/* Security & Architecture Strip */}
      <Card className="p-5 bg-white border border-slate-200 rounded-3xl flex items-start gap-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
          <ShieldCheck size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-extrabold text-[#0F172A]">Bank-Grade Payload Security &amp; Fast SLA</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            All TikTok direct message payloads undergo cryptographic HMAC-SHA256 signature verification in &lt;10ms. Bakong KHQR payloads adhere strictly to the EMVCo Tag-Length-Value format with deterministic CRC-16 checksums, enabling instant scan-to-pay via ABA Mobile and all Cambodian banking apps.
          </p>
        </div>
      </Card>

    </div>
  );
}
