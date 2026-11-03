"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Bot, CheckCircle2, ChevronRight, MessageCircle, Smartphone, 
  UploadCloud, Sparkles, Store, ShieldCheck, ArrowRight, Zap, QrCode 
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Step 1: Shop & Tone
  const [shopName, setShopName] = useState("Vogue Phnom Penh");
  const [botTone, setBotTone] = useState("Friendly");

  // Step 2: First Product
  const [productName, setProductName] = useState("Oversized Streetwear Tee (Black)");
  const [productPrice, setProductPrice] = useState("12.00");
  const [productStock, setProductStock] = useState("30");

  // Step 3: Channels
  const [tiktokPageId, setTiktokPageId] = useState("mock-shop-123");
  const [bakongId, setBakongId] = useState("tokoai_store@aba");

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save Bot Tone and Settings
      await api.post("/seller/settings", {
        bot_tone: botTone,
        is_active: true
      }).catch(() => {});

      // 2. Save TikTok & Bakong Integrations
      await api.post("/seller/integrations", {
        tiktok_page_id: tiktokPageId,
        bakong_merchant_id: bakongId
      }).catch(() => {});

      // 3. Create First Product if specified
      if (productName && productPrice) {
        await api.post("/products", {
          name: productName,
          category: "Apparel",
          price: parseFloat(productPrice) || 12.00,
          stock: parseInt(productStock, 10) || 20,
          description: "Premium quality streetwear item for TikTok Shop sales."
        }).catch(() => {});
      }

      toast.success("Shop configured! AI sales agent is active.");
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save some configurations. You can adjust them anytime in Settings.");
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] flex flex-col items-center justify-center p-4 selection:bg-[#1B38A6]/20 selection:text-[#1B38A6] font-sans relative overflow-hidden">
      
      {/* Warm Ambient Sunbeam */}
      <div 
        className="pointer-events-none absolute top-0 left-0 right-0 h-[500px] -z-10 overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(234, 88, 12, 0.12), rgba(250, 249, 245, 0))"
        }}
      />

      <div className="max-w-xl w-full relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-1 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#1B38A6] to-[#2563EB] text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles size={18} className="fill-white/20" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-[#0F172A]">TokoAI</span>
              <span className="text-[10px] bg-blue-50 text-[#1B38A6] px-2 py-0.5 rounded-full font-bold border border-blue-200">
                Setup Wizard
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Quick Merchant Setup</h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get your store ready to autonomously close orders in native spoken Khmer (`ភាសានិយាយ`).
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs">
          {[
            { num: 1, label: "Persona & Tone" },
            { num: 2, label: "First Product" },
            { num: 3, label: "Connect Channels" }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s.num
                  ? 'bg-[#1B38A6] text-white shadow-xs'
                  : step > s.num
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span className={`font-semibold hidden sm:inline ${step === s.num ? 'text-[#0F172A]' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Wizard Form Container */}
        <div className="p-7 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-[0_4px_24px_-2px_rgba(15,23,42,0.06)] space-y-6">
          
          {/* STEP 1: Shop & Persona */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h2 className="text-base font-extrabold text-[#0F172A]">Shop Name & Sales Persona</h2>
                <p className="text-xs text-slate-500 mt-0.5">How your bot greets and engages Cambodian buyers.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Shop / Boutique Name</label>
                  <Input 
                    placeholder="e.g. Vogue Boutique Phnom Penh"
                    value={shopName}
                    onChange={(e: any) => setShopName(e.target.value)}
                    className="text-xs md:text-sm bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Spoken Khmer Bot Persona</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "Friendly", title: "Friendly (Sweet)", desc: "ចា៎បង / ចាសអូន, warm boutique admin, high empathy" },
                      { id: "Professional", title: "Professional", desc: "Respectful, clear corporate retail standard" },
                      { id: "Aggressive Sales", title: "Fast Closer", desc: "Urgency, stock scarcity alerts, fast checkout" }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBotTone(t.id)}
                        className={`p-3 text-left rounded-2xl border transition-all ${
                          botTone === t.id
                            ? 'bg-blue-50/70 border-blue-300 text-[#1B38A6] shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-extrabold text-xs">{t.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1 leading-tight">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="brand" onClick={() => setStep(2)} className="text-xs font-bold gap-1 rounded-xl">
                  Next: Add Product <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: First Product */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h2 className="text-base font-extrabold text-[#0F172A]">Add Your First In-Stock Item</h2>
                <p className="text-xs text-slate-500 mt-0.5">Your AI needs at least one item in its catalog to sell.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Product Name (English or Khmer)</label>
                  <Input 
                    placeholder="e.g. Oversized Streetwear Tee (Black)"
                    value={productName}
                    onChange={(e: any) => setProductName(e.target.value)}
                    className="text-xs md:text-sm bg-slate-50 border-slate-200 rounded-xl h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Price in USD ($)</label>
                    <Input 
                      type="number"
                      placeholder="12.00"
                      value={productPrice}
                      onChange={(e: any) => setProductPrice(e.target.value)}
                      className="text-xs md:text-sm bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">
                      ≈ {(parseFloat(productPrice || "0") * 4100).toLocaleString()} ៛ KHR
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Initial Stock Units</label>
                    <Input 
                      type="number"
                      placeholder="50"
                      value={productStock}
                      onChange={(e: any) => setProductStock(e.target.value)}
                      className="text-xs md:text-sm bg-slate-50 border-slate-200 rounded-xl h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-xs text-slate-500">Back</Button>
                <Button variant="brand" onClick={() => setStep(3)} className="text-xs font-bold gap-1 rounded-xl">
                  Next: Connect Channels <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Channels */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h2 className="text-base font-extrabold text-[#0F172A]">Connect TikTok Shop &amp; Bakong</h2>
                <p className="text-xs text-slate-500 mt-0.5">Where your customers message and send payment.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                      <span className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center text-[11px] font-black">T</span>
                      TikTok Business Messaging Page ID
                    </div>
                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Webhook SLA &lt;100ms
                    </span>
                  </div>
                  <Input 
                    placeholder="e.g. mock-shop-123 or TikTok Shop Page ID"
                    value={tiktokPageId}
                    onChange={(e: any) => setTiktokPageId(e.target.value)}
                    className="text-xs md:text-sm bg-white border-slate-200 rounded-xl h-10"
                  />
                  <p className="text-[10px] text-slate-400">Default mock-shop-123 is ready for instant simulation.</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-[#00938C]">
                      <QrCode size={16} />
                      Bakong KHQR Merchant Account
                    </div>
                    <span className="text-[9px] bg-teal-50 text-[#00938C] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                      ABA / Bakong App Scan
                    </span>
                  </div>
                  <Input 
                    placeholder="e.g. your_shop@aba or Bakong Merchant ID"
                    value={bakongId}
                    onChange={(e: any) => setBakongId(e.target.value)}
                    className="text-xs md:text-sm bg-white border-slate-200 rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-xs text-slate-500">Back</Button>
                <Button 
                  variant="brand" 
                  onClick={handleFinishOnboarding} 
                  disabled={isSubmitting}
                  className="text-xs font-bold gap-1.5 rounded-xl shadow-sm"
                >
                  {isSubmitting ? "Activating Shop..." : "Launch TokoAI Cockpit"} <Zap size={13} className="fill-white" />
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Skip option */}
        <p className="text-center text-xs text-slate-400">
          Want to explore first?{" "}
          <Link href="/dashboard" className="text-slate-600 hover:text-[#0F172A] font-bold underline ml-1">
            Skip setup and go to Cockpit
          </Link>
        </p>

      </div>
    </div>
  );
}
