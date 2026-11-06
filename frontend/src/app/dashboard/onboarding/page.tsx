"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Sparkles, CheckCircle2, ArrowRight, Upload, Camera,
  QrCode, Bot, ShieldCheck, DollarSign, Store, Tag, RefreshCw
} from "lucide-react";

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Channels & Bakong
  const [tiktokPageId, setTiktokPageId] = useState("tiktok_store_kh");
  const [bakongId, setBakongId] = useState("seller@abaa");

  // Step 2: Vision Product Extract
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("Oversized Vintage Acid Wash Tee");
  const [productNameKh, setProductNameKh] = useState("អាវយឺត Oversized ម៉ូដ Vintage ពេញនិយម");
  const [price, setPrice] = useState("18.00");
  const [minBargainPrice, setMinBargainPrice] = useState("15.00");
  const [stock, setStock] = useState("50");
  const [extractingVision, setExtractingVision] = useState(false);

  // Step 3: Simulation Output
  const [simStep, setSimStep] = useState(0);

  const handleConnectChannels = async () => {
    setLoading(true);
    try {
      await api.post("/seller/integrations", {
        tiktok_page_id: tiktokPageId,
        bakong_merchant_id: bakongId
      });
      setStep(2);
    } catch (e) {
      // Continue anyway for seamless demo
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateVisionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractingVision(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/products/extract-vision", formData);
      if (res.data) {
        setProductName(res.data.name || productName);
        setProductNameKh(res.data.name_kh || productNameKh);
        if (res.data.price) setPrice(res.data.price.toString());
        if (res.data.min_negotiation_price) setMinBargainPrice(res.data.min_negotiation_price.toString());
        if (res.data.image_url) setProductImage(res.data.image_url);
      }
    } catch (err) {
      setProductImage(URL.createObjectURL(file));
    } finally {
      setExtractingVision(false);
    }
  };

  const handleSaveProductAndSimulate = async () => {
    setLoading(true);
    try {
      await api.post("/products", {
        name: productName,
        name_kh: productNameKh,
        price: parseFloat(price) || 18.0,
        min_negotiation_price: parseFloat(minBargainPrice) || 15.0,
        stock: parseInt(stock) || 50,
        image_url: productImage,
        category: "Streetwear"
      });
      setStep(3);
      runSimulation();
    } catch (e) {
      setStep(3);
      runSimulation();
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = () => {
    setSimStep(1);
    setTimeout(() => setSimStep(2), 1200);
    setTimeout(() => setSimStep(3), 2500);
    setTimeout(() => setSimStep(4), 3800);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        {/* Progress Tracker */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#1B38A6] text-white flex items-center justify-center font-bold text-sm">
                <Bot size={18} />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">TokoAI 2-Minute Launch Wizard</h1>
                <p className="text-xs text-slate-500 font-medium">Activate autonomous Khmer sales for your store</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#1B38A6] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Step {step} of 3
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-[#1B38A6]' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-[#1B38A6]' : 'bg-slate-200'}`} />
            <div className={`h-1.5 rounded-full ${step >= 3 ? 'bg-[#1B38A6]' : 'bg-slate-200'}`} />
          </div>
        </div>

        {/* STEP 1: Channels & Bakong */}
        {step === 1 && (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-sm font-black text-slate-900">Step 1: Connect Your Channel & Bank Account</h2>
              <p className="text-xs text-slate-500 font-medium font-khmer mt-0.5">
                ភ្ជាប់ TikTok Shop / Messenger និងគណនីធនាគារ Bakong KHQR ដើម្បីទទួលប្រាក់ស្វ័យប្រវត្ត
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  TikTok Shop or Facebook Page Username / ID
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50/50">
                  <Store size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={tiktokPageId}
                    onChange={(e) => setTiktokPageId(e.target.value)}
                    placeholder="e.g. my_boutique_kh"
                    className="flex-1 text-xs bg-transparent focus:outline-none text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bakong Merchant ID (ABA / Canadia / Bakong)
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50/50">
                  <QrCode size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={bakongId}
                    onChange={(e) => setBakongId(e.target.value)}
                    placeholder="e.g. yourshop@abaa"
                    className="flex-1 text-xs bg-transparent focus:outline-none text-slate-800 font-medium font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enables instant EMVCo CRC-16 KHQR generation directly in TikTok chats.
                </p>
              </div>
            </div>

            <button
              onClick={handleConnectChannels}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1B38A6] hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
            >
              Continue to Snap-to-Stock Vision <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* STEP 2: Snap-to-Stock Vision & Bargaining Floor */}
        {step === 2 && (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-sm font-black text-slate-900">Step 2: Snap-to-Stock Vision & Bargaining Floor</h2>
              <p className="text-xs text-slate-500 font-medium font-khmer mt-0.5">
                បញ្ចូលរូបភាពទំនិញដំបូងរបស់អ្នក ហើយកំណត់តម្លៃលក់ និងតម្លៃជញ្ជក់ទាបបំផុត (Bargaining Floor)
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleSimulateVisionUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1B38A6] flex items-center justify-center">
                  {extractingVision ? <RefreshCw size={20} className="animate-spin" /> : <Camera size={20} />}
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {extractingVision ? "Gemini 2.5 Flash Vision analyzing item..." : "Click or Drag Product Photo Here"}
                </div>
                <p className="text-[10px] text-slate-400">JPG, PNG, WebP up to 10MB</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name (EN)</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-khmer">ឈ្មោះជាភាសាខ្មែរ (KH)</label>
                <input
                  type="text"
                  value={productNameKh}
                  onChange={(e) => setProductNameKh(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-khmer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Retail Price ($ USD)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Min Bargaining Floor ($ USD)
                </label>
                <input
                  type="number"
                  value={minBargainPrice}
                  onChange={(e) => setMinBargainPrice(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-amber-600 font-bold bg-amber-50/40"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-khmer">AI នឹងមិនលក់ក្រោមតម្លៃនេះដាច់ខាត</p>
              </div>
            </div>

            <button
              onClick={handleSaveProductAndSimulate}
              disabled={loading || extractingVision}
              className="w-full flex items-center justify-center gap-2 bg-[#1B38A6] hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
            >
              Save & Test Live Bargaining Simulation <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* STEP 3: Live Sales Simulation & Launch */}
        {step === 3 && (
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-sm font-black text-slate-900">Step 3: Live Autonomous Sales Simulation</h2>
              <p className="text-xs text-slate-500 font-medium font-khmer mt-0.5">
                មើលរបៀបដែល TokoAI ឆ្លើយតបអតិថិជន និងតថ្លៃតាមភាសានិយាយខ្មែរស្វ័យប្រវត្ត
              </p>
            </div>

            {/* Simulated Chat Feed */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 font-khmer text-xs">
              {simStep >= 1 && (
                <div className="flex justify-end">
                  <div className="bg-white border border-slate-200 text-slate-800 p-3 rounded-2xl rounded-br-xs max-w-[80%] shadow-2xs">
                    B chos ban 15$ ot? Nhom yok 1 size L
                  </div>
                </div>
              )}

              {simStep >= 2 && (
                <div className="flex justify-start">
                  <div className="bg-[#1B38A6] text-white p-3 rounded-2xl rounded-bl-xs max-w-[80%] shadow-2xs leading-relaxed">
                    ចា៎បង! ដោយសារបងស្រឡាញ់ ខាងអូនជួយសម្រួលបញ្ចុះជូនពិសេសត្រឹម ${minBargainPrice} ណា៎បង 🥰 ឥឡូវអូនចេញវិក្កយបត្រ និង QR ជូនបងកក់ទុកភ្លាមៗណា៎!
                  </div>
                </div>
              )}

              {simStep >= 3 && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 text-slate-900 p-3.5 rounded-2xl rounded-bl-xs max-w-[80%] shadow-2xs space-y-2">
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>Bakong KHQR Payment</span>
                      <span className="text-[#1B38A6] font-bold">${parseFloat(minBargainPrice) + 1.50} USD</span>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-center font-mono text-[10px] text-slate-500">
                      [Dynamic Bakong KHQR Payload Attached]
                    </div>
                    <div className="text-[11px] text-slate-500">
                      សូមស្កេនទូទាត់តាម ABA Mobile ឬ Bakong ដើម្បីបញ្ជាក់ការកម្ម៉ង់!
                    </div>
                  </div>
                </div>
              )}

              {simStep >= 4 && (
                <div className="text-center py-2 text-emerald-600 font-bold text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} /> Closed sale autonomously in under 3 seconds!
                </div>
              )}
            </div>

            <button
              onClick={() => router.push("/dashboard/inbox")}
              className="w-full flex items-center justify-center gap-2 bg-[#1B38A6] hover:bg-blue-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Sparkles size={16} /> Launch My AI Sales Agent Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
