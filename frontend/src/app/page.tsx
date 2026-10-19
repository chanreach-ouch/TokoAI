"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, Zap, Bot, ShieldCheck, CheckCircle2, ArrowRight, 
  MessageSquare, ShoppingBag, Clock, QrCode, Truck, Phone, 
  TrendingUp, AlertCircle, ChevronDown, ChevronUp, Copy, Check,
  ExternalLink, Play, RotateCcw, Store, Shield, Users, DollarSign,
  ArrowUpRight, BarChart3, Layers, Sliders, Smartphone, CheckCheck,
  Send, UserCheck, Star
} from "lucide-react";

export default function LandingPage() {
  const [lang, setLang] = useState<"en" | "kh">("en");
  const [isAnnual, setIsAnnual] = useState(true);
  const [currency, setCurrency] = useState<"USD" | "KHR">("USD");

  // Interactive Live Demo Simulation State
  const [activeScenario, setActiveScenario] = useState<"midnight" | "khmeringlish" | "khqr">("midnight");
  const [isCopied, setIsCopied] = useState(false);
  const [simPaid, setSimPaid] = useState(false);
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);

  // Interactive ROI Calculator State
  const [dailyDms, setDailyDms] = useState(60);
  const [avgOrderValue, setAvgOrderValue] = useState(18);
  const [conversionRate, setConversionRate] = useState(14);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Calculation formulas
  const exchangeRate = 4100; // 1 USD = 4,100 KHR
  const monthlyOrders = Math.round(dailyDms * 30 * (conversionRate / 100));
  const monthlyRevenueUsd = monthlyOrders * avgOrderValue;
  const staffCostSavingsUsd = 450; // Average cost of 2 night shift admins in Phnom Penh

  const formatPrice = (usd: number) => {
    if (currency === "KHR") {
      return `${(usd * exchangeRate).toLocaleString()} ៛`;
    }
    return `$${usd.toLocaleString()}`;
  };

  const copyDemoText = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#0F172A] selection:bg-[#EA580C]/20 selection:text-[#EA580C] font-sans overflow-x-hidden relative">
      
      {/* ========================================================= */}
      {/* 0. SIGNATURE WARM RADIANT AURORA / SUNBEAM (FROM REFERENCE) */}
      {/* ========================================================= */}
      <div 
        className="pointer-events-none absolute top-0 left-0 right-0 h-[680px] -z-10 overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 90% 55% at 50% -12%, rgba(249, 115, 22, 0.22) 0%, rgba(254, 215, 170, 0.14) 45%, rgba(250, 249, 245, 0) 100%)"
        }}
      >
        {/* Soft luminous vertical ambient light rays */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,237,213,0.8),transparent_70%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(234,88,12,0.15),transparent_75%)] blur-2xl" />
      </div>

      {/* ========================================================= */}
      {/* 1. STICKY CLEAN NAVIGATION HEADER                         */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-[#FAF9F5]/85 backdrop-blur-md border-b border-black/[0.05] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          
          {/* Brand Logo with Sunset Warmth */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center text-white shadow-[0_4px_14px_rgba(234,88,12,0.35)] group-hover:scale-105 transition-transform">
              <Sparkles size={20} className="fill-white/20" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">TokoAI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100/80 text-[#EA580C] border border-orange-200/80">
                  🇰🇭 Cambodia
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">Autonomous TikTok Agent</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-[#EA580C] transition-colors">
              {lang === "en" ? "Features" : "លក្ខណៈពិសេស"}
            </a>
            <a href="#demo" className="hover:text-[#EA580C] transition-colors">
              {lang === "en" ? "Live AI Demo" : "សាកល្បង AI ផ្ទាល់"}
            </a>
            <a href="#solutions" className="hover:text-[#EA580C] transition-colors">
              {lang === "en" ? "Solutions" : "ដំណោះស្រាយ"}
            </a>
            <a href="#roi" className="hover:text-[#EA580C] transition-colors">
              {lang === "en" ? "ROI Calculator" : "គណនាប្រាក់ចំណេញ"}
            </a>
            <a href="#pricing" className="hover:text-[#EA580C] transition-colors">
              {lang === "en" ? "Pricing" : "តម្លៃសេវាកម្ម"}
            </a>
            <a href="#faqs" className="hover:text-[#EA580C] transition-colors">
              {lang === "en" ? "FAQs" : "សំណួរញឹកញាប់"}
            </a>
          </nav>

          {/* Right Header Utilities: Language + Auth CTAs */}
          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-white p-1 rounded-full border border-slate-200/80 shadow-sm">
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                  lang === "en" 
                    ? "bg-[#0F172A] text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("kh")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                  lang === "kh" 
                    ? "bg-[#EA580C] text-white shadow-sm font-khmer" 
                    : "text-slate-500 hover:text-slate-900 font-khmer"
                }`}
              >
                ខ្មែរ
              </button>
            </div>

            {/* Login Link */}
            <Link
              href="/login"
              className="hidden sm:inline-flex text-xs font-semibold text-slate-700 hover:text-[#0F172A] px-3 py-2 transition-colors"
            >
              {lang === "en" ? "Sign In" : "ចូលគណនី"}
            </Link>

            {/* High-Contrast Pill CTA (Active & Skyrocket style) */}
            <Link href="/register">
              <button className="h-10 px-5 rounded-full text-xs font-bold text-white bg-[#0F172A] hover:bg-black shadow-[0_4px_14px_rgba(15,23,42,0.18)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5">
                <span>{lang === "en" ? "Start Free" : "សាកល្បងឥតគិតថ្លៃ"}</span>
                <ArrowUpRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION WITH CENTERED TYPOGRAPHY (ACTIVE & SKYROCKET) */}
      {/* ========================================================= */}
      <section className="pt-16 pb-16 px-4 sm:px-6 max-w-7xl mx-auto text-center relative">
        
        {/* Social Proof Pill / Badge at Top */}
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8">
          <div className="flex -space-x-2 overflow-hidden">
            <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#EA580C] text-white text-[10px] font-bold flex items-center justify-center">S</span>
            <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#0F172A] text-white text-[10px] font-bold flex items-center justify-center">V</span>
            <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">K</span>
            <span className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">T</span>
          </div>
          <span className="text-xs font-semibold text-slate-700">
            {lang === "en" ? "Trusted by 2,400+ Cambodian TikTok Shops" : "ទុកចិត្តដោយអ្នកលក់ TikTok ខ្មែរជាង ២,៤០០+ ហាង"}
          </span>
          <div className="flex items-center text-amber-500 text-xs">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="ml-1 font-bold text-slate-900">5.0</span>
          </div>
        </div>

        {/* Hero Flanking Cards (From Active Reference - Framed on Large Displays) */}
        <div className="hidden 2xl:block absolute -left-8 top-32 z-10 w-64 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-[0_12px_30px_rgba(0,0,0,0.06)] transform -rotate-2 hover:rotate-0 transition-transform text-left">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Midnight AI Sales</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">+41.2%</span>
          </div>
          <div className="text-2xl font-black text-[#0F172A] tracking-tight">$18,055.94</div>
          <div className="text-[10px] text-slate-500 mt-0.5">74,029,350 ៛ automated this month</div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Orders Closed</span>
            <span className="font-bold text-[#EA580C]">252 Orders</span>
          </div>
        </div>

        <div className="hidden 2xl:block absolute -right-8 top-36 z-10 w-64 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-[0_12px_30px_rgba(0,0,0,0.06)] transform rotate-2 hover:rotate-0 transition-transform text-left">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold">Active Buyers</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] text-[10px] font-bold">TikTok Shop</span>
          </div>
          <div className="text-2xl font-black text-[#0F172A] tracking-tight">150,240+</div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex mt-2">
            <div className="w-[65%] bg-[#EA580C]" />
            <div className="w-[35%] bg-amber-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px]">
            <div>
              <span className="text-slate-400 block">J&T Express</span>
              <span className="font-bold text-slate-800">8,370 Pcs</span>
            </div>
            <div>
              <span className="text-slate-400 block">Virak Buntham</span>
              <span className="font-bold text-slate-800">5,490 Pcs</span>
            </div>
          </div>
        </div>

        {/* Impactful Centered Headline (Active & Skyrocket style) */}
        <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-[-0.03em] text-[#0F172A] leading-[1.15] max-w-3xl mx-auto">
          {lang === "en" ? (
            <>
              Close TikTok Orders <br />
              <span className="text-[#EA580C]">While You Sleep.</span>{" "}
              With AI Agents.
            </>
          ) : (
            <>
              បិទការបញ្ជាទិញ TikTok <br />
              <span className="text-[#EA580C]">ពេលអ្នកគេងលក់</span>{" "}
              ជាមួយ AI Agent ស្វ័យប្រវត្ត
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {lang === "en" 
            ? "40% of impulse buyers message between 10 PM and 2 AM. TokoAI intercepts incoming TikTok DMs in under 1.2s, converses naturally in spoken Khmer, and generates dynamic Bakong KHQR checkouts instantly."
            : "៤០% នៃអតិថិជនឆាតទិញនៅចន្លោះម៉ោង ១០ យប់ ដល់ ២ ភ្លឺ។ TokoAI ឆ្លើយតបសារ TikTok ភ្លាមៗក្រោម ១.២ វិនាទី និយាយភាសាខ្មែរយ៉ាងរលូន និងបង្កើត Bakong KHQR ស្វ័យប្រវត្ត។"}
        </p>

        {/* Feature Check Pills (From Active reference) */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm">
            <CheckCircle2 size={15} className="text-[#EA580C]" />
            <span>{lang === "en" ? "Spoken Khmer & Romanized Slang" : "យល់ភាសានិយាយ & អក្សរឡាតាំង"}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm">
            <CheckCircle2 size={15} className="text-[#EA580C]" />
            <span>{lang === "en" ? "Dynamic Bakong KHQR Checkout" : "បង្កើត Bakong KHQR ស្វ័យប្រវត្ត"}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm">
            <CheckCircle2 size={15} className="text-[#EA580C]" />
            <span>{lang === "en" ? "1-Tap J&T & VET Dispatch" : "ចេញវិក្កយបត្រ J&T & VET ភ្លាមៗ"}</span>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-9">
          <Link href="/register">
            <button className="h-13 px-8 rounded-full text-sm font-bold text-white bg-[#0F172A] hover:bg-black shadow-[0_10px_25px_-5px_rgba(15,23,42,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5">
              <span>{lang === "en" ? "Deploy AI Agent (Free 50 Chats)" : "ដំណើរការ AI Agent (ឥតគិតថ្លៃ ៥០ សារ)"}</span>
              <ArrowRight size={16} />
            </button>
          </Link>
          <a href="#demo">
            <button className="h-13 px-7 rounded-full text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm transition-all flex items-center gap-2">
              <Play size={14} className="fill-[#EA580C] text-[#EA580C]" />
              <span>{lang === "en" ? "Try Live Inference Demo" : "សាកល្បង Demo ផ្ទាល់"}</span>
            </button>
          </a>
        </div>

        <p className="text-[11px] text-slate-500 mt-4 flex items-center justify-center gap-3">
          <span>🔒 No Credit Card Required</span>
          <span>•</span>
          <span>⚡ Sub-100ms Webhook SLA</span>
          <span>•</span>
          <span>🛡️ HMAC-SHA256 Authenticated</span>
        </p>
      </section>

      {/* ========================================================= */}
      {/* 3. CENTERPIECE HIGH-DENSITY SOFTWARE DASHBOARD SHOWCASE   */}
      {/* (FUSED WITH ACTIVE FLOATING CARDS & SKYROCKET METRICS)     */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto pb-24 relative" id="demo">
        {/* Main Dashboard Container (Skyrocket Reference Density) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-4 sm:p-7 relative overflow-hidden">
          
          {/* Dashboard Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Store size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#0F172A]">Streetwear Cambodia (@streetwear_kh)</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    AI Agent Active (24/7)
                  </span>
                </div>
                <span className="text-xs text-slate-500">Phnom Penh Midnight Shift • Webhook SLA: 88ms</span>
              </div>
            </div>

            {/* Human Takeover Emergency Switch */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsHumanTakeover(!isHumanTakeover)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isHumanTakeover 
                    ? "bg-rose-500 text-white shadow-sm" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <UserCheck size={14} />
                <span>{isHumanTakeover ? "AI Paused (Human Takeover)" : "Pause AI & Take Over"}</span>
              </button>
              
              <button 
                onClick={() => setSimPaid(false)}
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* High-Density 2-Column Split: AI Chat Console vs. Live Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 7 Columns: Live TikTok Inbound Message & RAG Pipeline */}
            <div className="lg:col-span-7 bg-[#FAF9F6] rounded-2xl border border-slate-200/80 p-5 space-y-4">
              
              {/* Interactive Scenario Tabs */}
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200/60 overflow-x-auto text-xs font-bold">
                <button
                  onClick={() => { setActiveScenario("midnight"); setSimPaid(false); }}
                  className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeScenario === "midnight"
                      ? "bg-[#EA580C] text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <Clock size={13} />
                  <span>1:15 AM In-Stock</span>
                </button>

                <button
                  onClick={() => { setActiveScenario("khmeringlish"); setSimPaid(false); }}
                  className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeScenario === "khmeringlish"
                      ? "bg-[#EA580C] text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <span>🔤 Khmeringlish</span>
                </button>

                <button
                  onClick={() => { setActiveScenario("khqr"); setSimPaid(false); }}
                  className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeScenario === "khqr"
                      ? "bg-[#EA580C] text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  <QrCode size={13} />
                  <span>Bakong KHQR</span>
                </button>
              </div>

              {/* Chat Message Turns */}
              <div className="space-y-4 pt-1">
                
                {/* 1. Inbound Customer Turn */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-white rounded-2xl rounded-tr-xs border border-slate-200/80 p-3.5 shadow-sm">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-bold text-[#EA580C]">@vicheka_99</span>
                      <span>1:15 AM</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800">
                      {activeScenario === "midnight" && "អាវយឺត Oversized Black នេះមានស្តុកអត់បង? ចង់ទិញមួយ!"}
                      {activeScenario === "khmeringlish" && "B Kz castor hx ng pro khos knea mx? mean stock ot?"}
                      {activeScenario === "khqr" && "យក ១ បង! ផ្ញើមកផ្ទះលេខ 12 ផ្លូវ 2004 ភ្នំពេញ លេខខ្ញុំ 012 884 921"}
                    </p>
                  </div>
                </div>

                {/* 2. RAG Context Telemetry Pill */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-[10px] font-semibold text-[#EA580C]">
                    <Sparkles size={11} />
                    <span>
                      {activeScenario === "midnight" && "Queried PostgreSQL pgvector: SKU-TEE-BLK (Stock: 14)"}
                      {activeScenario === "khmeringlish" && "Decoded Romanized Khmer: 'ខោខូវប៊យ' -> SKU-JEANS-01 (Stock: 8)"}
                      {activeScenario === "khqr" && "Generated Bakong KHQR payload + EMVCo CRC-16 Checksum"}
                    </span>
                  </div>
                </div>

                {/* 3. TokoAI Outbound Agent Reply */}
                <div className="flex justify-start">
                  <div className="max-w-[90%] bg-white rounded-2xl rounded-tl-xs border border-slate-200/90 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#EA580C]" />
                        TokoAI Auto-Pilot
                      </span>
                      <span className="text-[10px] text-slate-400">1.1s reply</span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-relaxed font-khmer">
                      {activeScenario === "midnight" && (
                        "បាទបង! នៅសល់ 14 អាវក្នុងស្តុក។ តម្លៃត្រឹមតែ $12.00 (49,200៛) ទេបង។ សាច់ក្រណាត់ហាប់ស្អាតត្រជាក់ស្រួលពាក់។ បងចង់ឱ្យប្អូនចេញ QR កូដទូទាត់ជូនឥឡូវនេះអត់បង?"
                      )}
                      {activeScenario === "khmeringlish" && (
                        "ចាសបង! ម៉ូដខោខូវប៊យទាំងពីរខុសគ្នាតែជើងខោទេបង។ មួយជើងធំ (Baggy) និងមួយទៀតជើងត្រង់ (Regular)។ ម៉ូដទាំងពីរសុទ្ធតែមានស្តុកស្រាប់ទំហំ 28 ដល់ 34 បងចង់បានមួយណាដែរចាស?"
                      )}
                      {activeScenario === "khqr" && (
                        "ចាសបង! ប្អូនបានបង្កើតវិក្កយបត្រ #ORD-8821 រួចរាល់ហើយ។ បងអាចស្កេន KHQR ខាងក្រោមនេះតាមរយៈ ABA Mobile ឬ Bakong App បានភ្លាមៗ៖"
                      )}
                    </p>

                    {/* Integrated KHQR Card Component for KHQR Scenario */}
                    {activeScenario === "khqr" && (
                      <div className="rounded-xl border border-slate-200 bg-[#FAF9F5] p-3.5 space-y-3">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#EA580C] flex items-center gap-1">
                            <QrCode size={13} />
                            BAKONG KHQR (EMVCo)
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">CRC-16: 8C1F</span>
                        </div>

                        {/* Interactive QR Preview */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-lg border border-slate-200/70">
                          <div className="w-24 h-24 bg-white p-1 rounded-md border border-slate-200 flex items-center justify-center shrink-0">
                            {/* Realistic EMVCo KHQR SVG */}
                            <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                              <rect x="5" y="5" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                              <rect x="13" y="13" width="12" height="12" rx="1" />
                              <rect x="67" y="5" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                              <rect x="75" y="13" width="12" height="12" rx="1" />
                              <rect x="5" y="67" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                              <rect x="13" y="75" width="12" height="12" rx="1" />
                              <rect x="42" y="15" width="8" height="8" />
                              <rect x="50" y="25" width="8" height="8" />
                              <rect x="45" y="45" width="12" height="12" fill="#EA580C" />
                              <text x="51" y="53" fontSize="5" fill="white" fontWeight="bold" textAnchor="middle">KHQR</text>
                              <rect x="70" y="45" width="8" height="8" />
                              <rect x="42" y="70" width="8" height="8" />
                              <rect x="75" y="75" width="8" height="8" />
                            </svg>
                          </div>

                          <div className="text-center sm:text-left space-y-1">
                            <div className="text-xs font-bold text-slate-900">Total: $19.00 USD</div>
                            <div className="text-[10px] text-slate-500">77,900 ៛ (1 Oversized Tee + Phnom Penh Delivery)</div>
                            <div className="text-[10px] font-mono text-slate-400">Merchant: TokoAI Streetwear Store</div>

                            {!simPaid ? (
                              <button
                                onClick={() => setSimPaid(true)}
                                className="mt-2 px-3 py-1.5 rounded-full text-[11px] font-bold text-white bg-gradient-to-r from-[#EA580C] to-amber-500 hover:opacity-95 shadow-sm transition-all flex items-center gap-1.5"
                              >
                                <Zap size={12} />
                                <span>Simulate ABA Mobile Payment Scan</span>
                              </button>
                            ) : (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                <CheckCheck size={13} />
                                <span>Paid via ABA! Waybill JNT-KH-9921 Generated</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>

            {/* Right 5 Columns: Executive Telemetry & Conversion Gauges (Skyrocket Style) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Widget 1: Sales Performance Gauge */}
              <div className="bg-[#FAF9F6] rounded-2xl border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Midnight Conversion Rate</span>
                  <span className="text-[#EA580C] font-bold">10 PM — 2 AM</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-3xl font-black text-[#0F172A] tracking-tight">68.4%</div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">↑ 3.2x vs human staff delay</div>
                  </div>

                  {/* Segmented Radial Arc Gauge */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#EA580C]"
                        strokeDasharray="68, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-[11px] font-bold text-slate-800">68%</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Monthly DMs Handled</span>
                    <span className="font-bold text-slate-800">2,460 Chats</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Recovered Revenue</span>
                    <span className="font-bold text-slate-800">$45,300 USD</span>
                  </div>
                </div>
              </div>

              {/* Widget 2: Recent Live Stream Orders Dispatched */}
              <div className="bg-[#FAF9F6] rounded-2xl border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Recent Live Orders</span>
                  <span className="text-slate-400 text-[10px]">Real-Time Sync</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-orange-100 text-[#EA580C] font-bold flex items-center justify-center text-[10px]">
                        VS
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Vicheka Sok</div>
                        <div className="text-[10px] text-slate-400">012 884 921 • Phnom Penh</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">$19.00</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">PAID</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        SC
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Sreynich Chan</div>
                        <div className="text-[10px] text-slate-400">098 554 112 • Siem Reap</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">$34.00</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">J&T WAYBILL</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-[10px]">
                        BH
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Borey Heng</div>
                        <div className="text-[10px] text-slate-400">015 332 990 • Battambang</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">$12.00</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">PAID</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Social Proof Strip Below Showcase (From Active & Skyrocket) */}
        <div className="mt-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
            {lang === "en" ? "Trusted by 2,500+ businesses globally & top Cambodian sellers" : "ជឿទុកចិត្តដោយអាជីវកម្មជាង ២,៥០០+ និងអ្នកលក់កំពូលៗនៅកម្ពុជា"}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all text-xs font-extrabold text-slate-600">
            <span className="flex items-center gap-1.5"><Store size={15} /> Phnom Penh Streetwear</span>
            <span className="flex items-center gap-1.5"><Sparkles size={15} /> K-Beauty Siem Reap</span>
            <span className="flex items-center gap-1.5"><ShoppingBag size={15} /> AudioTech Cambodia</span>
            <span className="flex items-center gap-1.5"><Truck size={15} /> J&T Express Certified</span>
            <span className="flex items-center gap-1.5"><Truck size={15} /> Virak Buntham VET</span>
            <span className="flex items-center gap-1.5"><QrCode size={15} /> Bakong KHQR Approved</span>
          </div>
        </div>

      </section>

      {/* ========================================================= */}
      {/* 4. VALUABLE FEATURES BENTO GRID (ACTIVE REFERENCE STYLE)  */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200/60" id="features">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-block px-3.5 py-1 rounded-full bg-orange-50 text-[#EA580C] text-xs font-bold border border-orange-200/80">
            {lang === "en" ? "Valuable Features" : "មុខងារសំខាន់ៗ"}
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
            {lang === "en" ? "Customizable Solutions for Every Need" : "ដំណោះស្រាយគ្រប់តម្រូវការអាជីវកម្ម"}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {lang === "en" 
              ? "Adapt TokoAI to suit your unique live stream and chat sales needs with flexible, scalable tools designed for Cambodia."
              : "រៀបចំ TokoAI ឱ្យត្រូវតាមតម្រូវការលក់ជាក់ស្តែងរបស់អ្នក ជាមួយនឹងប្រព័ន្ធបត់បែន និងរហ័សទាន់ចិត្ត។"}
          </p>
        </div>

        {/* 3-Column Top Row Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Card 1: Real Time Analytics */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C]">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">
                  {lang === "en" ? "Real Time Live Analytics" : "ទិន្នន័យជាក់ស្តែងពេល Live"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === "en" 
                    ? "Monitor sales performance and conversion velocity with instant insights during live streams."
                    : "តាមដានល្បឿនបិទការលក់ និងចំនួនអ្នកឆាតទិញភ្លាមៗពេលកំពុង Live។"}
                </p>
              </div>
            </div>

            {/* Embedded Mini UI Preview */}
            <div className="mt-6 p-3.5 bg-[#FAF9F5] rounded-2xl border border-slate-200/70">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                <span>Average Daily Sales</span>
                <span className="font-bold text-[#EA580C]">$1,450.00</span>
              </div>
              <div className="h-16 flex items-end gap-1.5 pt-2">
                {[30, 45, 60, 40, 75, 90, 85, 100, 70, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-200 rounded-t-sm hover:bg-[#EA580C] transition-colors" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Native Spoken Khmer & Slang */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C]">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">
                  {lang === "en" ? "Native Spoken Khmer" : "ភាសានិយាយ & អក្សរឡាតាំង"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === "en"
                    ? "Effortlessly deciphers Romanized phonetic slang (Khmeringlish) like 'man stock ot' without rigid formal phrasing."
                    : "យល់ភាសាខ្មែរសរសេរជាឡាតាំង និងភាសានិយាយទូទៅរបស់អតិថិជនបាន ១០០%។"}
                </p>
              </div>
            </div>

            {/* Embedded Mini UI Preview */}
            <div className="mt-6 p-3.5 bg-[#FAF9F5] rounded-2xl border border-slate-200/70 space-y-2 text-xs">
              <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-[11px]">
                <span className="font-bold block">❌ Generic Bot:</span>
                "សូមអភ័យទោស ខ្ញុំមិនយល់ពីសំណើ..."
              </div>
              <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-[11px]">
                <span className="font-bold block">✅ TokoAI Spoken Khmer:</span>
                "បាទបង! នៅសល់ 8 អាវចុងក្រោយក្នុងស្តុក..."
              </div>
            </div>
          </div>

          {/* Card 3: Team Collaboration & Staff RBAC */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C]">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">
                  {lang === "en" ? "Staff Delegation & RBAC" : "គ្រប់គ្រងបុគ្គលិក & សុវត្ថិភាព"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === "en"
                    ? "Empower day shift human agents with role-based access while maintaining full financial security."
                    : "បែងចែកសិទ្ធិបុគ្គលិកឆ្លើយឆាតពេលថ្ងៃ និងរក្សាសុវត្ថិភាពទិន្នន័យហិរញ្ញវត្ថុហាង។"}
                </p>
              </div>
            </div>

            {/* Embedded Mini UI Preview */}
            <div className="mt-6 p-3.5 bg-[#FAF9F5] rounded-2xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-[11px] p-2 bg-white rounded-lg border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[9px] flex items-center justify-center">O</div>
                  <span className="font-bold text-slate-800">Shop Owner</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">Full Access</span>
              </div>
              <div className="flex items-center justify-between text-[11px] p-2 bg-white rounded-lg border border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#EA580C] text-white font-bold text-[9px] flex items-center justify-center">A</div>
                  <span className="font-bold text-slate-800">Live Stream Staff</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] font-bold">Chat Only</span>
              </div>
            </div>
          </div>

        </div>

        {/* 2-Column Bottom Row Bento Cards (Active Reference Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 4: Dynamic Bakong KHQR Settlement */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C]">
                <QrCode size={20} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">
                {lang === "en" ? "Dynamic Bakong KHQR Settlement" : "ទូទាត់ប្រាក់ភ្លាមៗតាម Bakong KHQR"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {lang === "en"
                  ? "Zero copy-pasting static account numbers. Zero manual screenshot confirmation. TokoAI generates an exact EMVCo payment QR and reconciles settlements automatically."
                  : "លែងបាច់ផ្ញើលេខគណនី និងពិនិត្យ Screenshot ផ្ទេរប្រាក់ដោយដៃ។ ប្រព័ន្ធចេញ KHQR មានតម្លៃប្រាក់ជាក់លាក់ និងផ្ទៀងផ្ទាត់ស្វ័យប្រវត្ត។"}
              </p>
            </div>

            <div className="mt-6 p-4 bg-[#FAF9F5] rounded-2xl border border-slate-200/70 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">Bakong Bank Reconciliation</div>
                <div className="text-[11px] text-slate-500">Supported: ABA Mobile, Acleda, Wing, Canadia</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/80">
                100% Zero Fee
              </span>
            </div>
          </div>

          {/* Card 5: Automated Cambodian Logistics & Dispatch */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C]">
                <Truck size={20} />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A]">
                {lang === "en" ? "1-Tap Cambodian Waybill Dispatch" : "ចេញវិក្កយបត្រដឹកជញ្ជូន ១ ចុច"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                {lang === "en"
                  ? "Parses local phone numbers (012, 015, 098) and informal landmark delivery addresses. Automatically generates waybills for J&T Express and Virak Buntham VET."
                  : "ស្រង់លេខទូរស័ព្ទខ្មែរ និងទីតាំងសម្គាល់ដឹកជញ្ជូនដោយស្វ័យប្រវត្ត រួមទាំងបង្កើតលេខកូដដឹកជញ្ជូន J&T Express និង វីរៈប៊ុនថាំ ភ្លាមៗ។"}
              </p>
            </div>

            <div className="mt-6 p-4 bg-[#FAF9F5] rounded-2xl border border-slate-200/70 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">Supported Carriers</div>
                <div className="text-[11px] text-slate-500">Phnom Penh & 24 Provinces Nationwide</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-50 text-[#EA580C] text-xs font-bold border border-orange-200/80">
                J&T + Virak Buntham
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* 5. OPERATIONAL EXCELLENCE & BENEFITS (ACTIVE REFERENCE)   */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200/60" id="solutions">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Mission & Pill Tags */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-orange-50 text-[#EA580C] text-xs font-bold border border-orange-200/70">
              {lang === "en" ? "Operational Benefits" : "ផលប្រយោជន៍អាជីវកម្ម"}
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
              {lang === "en" ? (
                <>
                  Unlock a New Era of <br />
                  Operational Excellence <br />
                  and Innovation
                </>
              ) : (
                <>
                  ពង្រីកការលក់របស់អ្នក <br />
                  ជាមួយប្រព័ន្ធឆ្លើយតប <br />
                  ស្វ័យប្រវត្តឈានមុខគេ
                </>
              )}
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              {lang === "en"
                ? "Unlock operational excellence and retail innovation with TokoAI's autonomous tools. Never leave money on the table when your midnight live stream viewers are eager to buy."
                : "កាត់បន្ថយការបាត់បង់ការលក់ពេលយប់ជ្រៅ និងបង្កើនប្រាក់ចំណេញដោយមិនចាំបាច់ជួលបុគ្គលិកវេនយប់ច្រើននាក់។"}
            </p>

            {/* Pill Tags (From Active Reference) */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-sm">
                Robust Security
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-sm">
                Customizable
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-sm">
                Bakong Certified
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-sm">
                Automated Efficiency
              </span>
              <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-sm">
                Zero Human Lag
              </span>
            </div>
          </div>

          {/* Right Column: Icon Feature List (From Active Reference) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C] shrink-0 mt-0.5">
                <Sparkles size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0F172A]">
                  {lang === "en" ? "Native Spoken Tone & Persona" : "ទឹកដមសំឡេងលក់ដូររួសរាយ"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lang === "en"
                    ? "Trained on real Cambodian retail conversations. Sounds like a warm, knowledgeable Phnom Penh sales admin rather than a robotic translation."
                    : "បណ្តុះបណ្តាលលើការសន្ទនាលក់ដូរពិតៗនៅកម្ពុជា និយាយផ្អែមល្ហែម រួសរាយ និងបិទការលក់បានលឿន។"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C] shrink-0 mt-0.5">
                <Zap size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0F172A]">
                  {lang === "en" ? "Fast and Scalable Architecture" : "លឿនរហ័ស ធន់នឹងការឆាតរាប់ពាន់សារ"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lang === "en"
                    ? "Sub-100ms webhook ingestion backed by Redis and ARQ. Capable of handling over 10,000 simultaneous DMs during viral TikTok live streams."
                    : "រចនាសម្ព័ន្ធបច្ចេកវិទ្យាទំនើប អាចទ្រទ្រង់ការផ្ញើសាររាប់ពាន់ក្នុងពេលតែមួយ ពេលវីដេអូរបស់អ្នកផ្ទុះការចាប់អារម្មណ៍ខ្លាំង។"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C] shrink-0 mt-0.5">
                <Sliders size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0F172A]">
                  {lang === "en" ? "Customizable Store Knowledge Base" : "បញ្ចូលទិន្នន័យទំនិញងាយស្រួល"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lang === "en"
                    ? "Upload your photos, price lists, size charts, and custom delivery terms. Gemini Vision auto-indexes your catalog in seconds."
                    : "គ្រាន់តែ Upload រូបភាព និងតារាងតម្លៃ Gemini Vision នឹងទាញយកទិន្នន័យស្វ័យប្រវត្តក្នុងរយៈពេលប៉ុន្មានវិនាទី។"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200/70 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#EA580C] shrink-0 mt-0.5">
                <DollarSign size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0F172A]">
                  {lang === "en" ? "Maximum Efficiency & Cost Savings" : "សន្សំសំចៃការចំណាយខ្ពស់"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {lang === "en"
                    ? "Saves up to $450/month on night shift customer service staff while lifting overall order capture rates by 35%."
                    : "សន្សំប្រាក់រហូតដល់ $450 ក្នុងមួយខែពីថ្លៃជួលបុគ្គលិកវេនយប់ និងបង្កើនការបិទការលក់បាន ៣៥% បន្ថែម។"}
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. DUAL-CURRENCY ROI CALCULATOR SECTION                   */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200/60" id="roi">
        
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-block px-3.5 py-1 rounded-full bg-orange-50 text-[#EA580C] text-xs font-bold border border-orange-200/80">
            {lang === "en" ? "Direct Revenue Model" : "គណនាផលចំណេញ"}
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
            {lang === "en" ? "How Much Revenue Are You Leaving Behind?" : "តើអ្នកបាត់បង់ប្រាក់ចំណូលប៉ុន្មានពេលគេង?"}
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            {lang === "en" 
              ? "Calculate your estimated monthly sales boost from 24/7 instant responses and Bakong checkout."
              : "គណនាប្រាក់ចំណូលបន្ថែមដែលអ្នកនឹងទទួលបានពីការឆ្លើយតបឆាត ២៤/៧ និងការទូទាត់រហ័ស។"}
          </p>

          {/* Currency Toggle */}
          <div className="pt-3 flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Currency:</span>
            <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  currency === "USD" 
                    ? "bg-[#0F172A] text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency("KHR")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  currency === "KHR" 
                    ? "bg-[#EA580C] text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                KHR (៛)
              </button>
            </div>
          </div>
        </div>

        {/* Calculator Pod (Clean White Surface with Warm Orange Elements) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.06)] p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left 7 Columns: Sliders */}
            <div className="md:col-span-7 space-y-6">
              
              {/* Slider 1: Daily TikTok DMs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700">
                    {lang === "en" ? "Daily TikTok & Messenger DMs" : "ចំនួនសារឆាតចូលក្នុងមួយថ្ងៃ"}
                  </span>
                  <span className="text-[#EA580C] font-mono text-sm bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                    {dailyDms} chats / day
                  </span>
                </div>
                <input 
                  type="range" 
                  min="15" 
                  max="300" 
                  value={dailyDms} 
                  onChange={(e) => setDailyDms(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#EA580C]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>15 chats</span>
                  <span>150 chats</span>
                  <span>300+ chats</span>
                </div>
              </div>

              {/* Slider 2: Average Order Value */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700">
                    {lang === "en" ? "Average Order Value (AOV)" : "តម្លៃជាមធ្យមក្នុងមួយការបញ្ជាទិញ"}
                  </span>
                  <span className="text-[#EA580C] font-mono text-sm bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                    {formatPrice(avgOrderValue)}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="80" 
                  value={avgOrderValue} 
                  onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#EA580C]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{formatPrice(5)}</span>
                  <span>{formatPrice(40)}</span>
                  <span>{formatPrice(80)}</span>
                </div>
              </div>

              {/* Slider 3: Conversion Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700">
                    {lang === "en" ? "Expected Conversion Rate" : "អត្រាបិទការលក់ជោគជ័យ"}
                  </span>
                  <span className="text-emerald-700 font-mono text-sm bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    {conversionRate}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="35" 
                  value={conversionRate} 
                  onChange={(e) => setConversionRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>5% (Conservative)</span>
                  <span>14% (Typical TokoAI)</span>
                  <span>35% (Viral Live Stream)</span>
                </div>
              </div>

            </div>

            {/* Right 5 Columns: Result Pod */}
            <div className="md:col-span-5 bg-[#FAF9F6] rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {lang === "en" ? "Estimated Monthly AI Revenue" : "ប្រាក់ចំណូលបន្ថែមប្រចាំខែតាម AI"}
                </span>
                <div className="text-3xl sm:text-4xl font-black text-[#EA580C] tracking-tight">
                  {formatPrice(monthlyRevenueUsd)}
                </div>
                <p className="text-xs text-slate-500">
                  {lang === "en"
                    ? `From ${monthlyOrders.toLocaleString()} successfully closed orders that would otherwise abandon.`
                    : `មកពីការបិទការបញ្ជាទិញចំនួន ${monthlyOrders.toLocaleString()} ដែលពីមុនតែងតែបាត់បង់។`}
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200/60 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Night Shift Staff Saved:</span>
                  <span className="font-bold text-emerald-700">{formatPrice(staffCostSavingsUsd)} / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Average Response Time:</span>
                  <span className="font-bold text-slate-800">&lt; 1.2 Seconds</span>
                </div>
              </div>

              <Link href="/register">
                <button className="w-full h-11 rounded-full text-xs font-bold text-white bg-[#0F172A] hover:bg-black shadow-md transition-all flex items-center justify-center gap-2">
                  <span>{lang === "en" ? "Capture This Revenue Today" : "ចាប់ផ្តើមរកប្រាក់ចំណូលឥឡូវនេះ"}</span>
                  <ArrowRight size={14} />
                </button>
              </Link>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================= */}
      {/* 7. TRANSPARENT PRICING MATRIX                             */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200/60" id="pricing">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-block px-3.5 py-1 rounded-full bg-orange-50 text-[#EA580C] text-xs font-bold border border-orange-200/80">
            {lang === "en" ? "Simple, Predictable Plans" : "កញ្ចប់តម្លៃច្បាស់លាស់"}
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
            {lang === "en" ? "Pricing Engineered for Growth" : "តម្លៃសមរម្យសម្រាប់អាជីវកម្មខ្មែរ"}
          </h2>
          <p className="text-sm text-slate-600">
            {lang === "en" 
              ? "Start completely free. Upgrade only when your order volume explodes."
              : "ចាប់ផ្តើមដោយឥតគិតថ្លៃ។ ដំឡើងគម្រោងនៅពេលដែលការបញ្ជាទិញរបស់អ្នកកើនឡើង។"}
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs font-bold">
            <span className={!isAnnual ? "text-slate-900" : "text-slate-400"}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 bg-slate-200 rounded-full p-1 relative transition-colors"
            >
              <div 
                className={`w-4 h-4 rounded-full bg-[#EA580C] shadow-sm transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className={isAnnual ? "text-slate-900" : "text-slate-400"}>
              Annual <span className="text-[#EA580C] text-[10px] font-extrabold">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Tier 1: Free Starter */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#0F172A]">Starter Trial</h3>
              <p className="text-xs text-slate-500">Perfect for small test shops getting started on TikTok.</p>
              <div className="text-4xl font-extrabold text-[#0F172A]">
                $0 <span className="text-xs font-normal text-slate-400">/ forever</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> 50 AI Messages / month
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> Bakong KHQR dynamic generator
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> 1 Shop Connection
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> Spoken Khmer prompt guardrails
                </li>
              </ul>
            </div>

            <Link href="/register">
              <button className="w-full h-11 rounded-full text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all">
                Get Started Free
              </button>
            </Link>
          </div>

          {/* Tier 2: Pro Retailer (Highlighted) */}
          <div className="rounded-3xl bg-white border-2 border-[#EA580C] p-8 flex flex-col justify-between space-y-6 relative shadow-[0_20px_50px_rgba(234,88,12,0.12)] scale-105 z-10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#EA580C] text-white text-[10px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Most Popular
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#0F172A]">Pro Retailer</h3>
              <p className="text-xs text-slate-500">For active shops with steady daily TikTok DMs.</p>
              <div className="text-4xl font-extrabold text-[#0F172A]">
                {isAnnual ? "$24" : "$29"} <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                <li className="flex items-center gap-2 font-semibold">
                  <Check size={14} className="text-[#EA580C]" /> 2,500 AI Messages / month
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#EA580C]" /> Gemini Vision Catalog Ingestion
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#EA580C]" /> J&T & Virak Buntham 1-Tap Waybills
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#EA580C]" /> 2 Staff Agent accounts (RBAC)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-[#EA580C]" /> Human Takeover AI Pause toggle
                </li>
              </ul>
            </div>

            <Link href="/register">
              <button className="w-full h-11 rounded-full text-xs font-bold text-white bg-[#EA580C] hover:bg-[#D97706] shadow-md transition-all">
                Start 14-Day Free Trial
              </button>
            </Link>
          </div>

          {/* Tier 3: Live Stream Powerhouse */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#0F172A]">Scale Merchant</h3>
              <p className="text-xs text-slate-500">For high-traffic live stream retailers & multi-shops.</p>
              <div className="text-4xl font-extrabold text-[#0F172A]">
                {isAnnual ? "$79" : "$99"} <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 pt-4 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> Unlimited AI Messages
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> Multi-Shop Management (Up to 5 shops)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> Priority WhatsApp & Telegram Support
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" /> Dedicated Account Manager in Phnom Penh
                </li>
              </ul>
            </div>

            <Link href="/register">
              <button className="w-full h-11 rounded-full text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all">
                Contact Sales
              </button>
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. FREQUENTLY ASKED QUESTIONS (ACCORDION)                 */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto border-t border-slate-200/60" id="faqs">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-[#0F172A]">
            {lang === "en" ? "Frequently Asked Questions" : "សំណួរដែលសួរញឹកញាប់"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {lang === "en" 
              ? "Everything you need to know about setting up TokoAI for your TikTok shop."
              : "ព័ត៌មានលម្អិតអំពីការប្រើប្រាស់ TokoAI សម្រាប់អាជីវកម្មរបស់អ្នក។"}
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: lang === "en" ? "Will this get my TikTok account or shop banned?" : "តើការប្រើប្រាស់ TokoAI ធ្វើឱ្យប៉ះពាល់ដល់គណនី TikTok ដែរឬទេ?",
              a: lang === "en"
                ? "No. TokoAI integrates strictly via official TikTok Business Messaging Webhooks using HMAC-SHA256 signature authentication. We do not use unauthorized scraping or fragile browser automation."
                : "មិនប៉ះពាល់ដាច់ខាត។ TokoAI ភ្ជាប់តាមរយៈប្រព័ន្ធផ្លូវការ TikTok Business Messaging Webhook ដោយមានសុវត្ថិភាពខ្ពស់ និងស្របតាមគោលការណ៍ TikTok ១០០%។"
            },
            {
              q: lang === "en" ? "Can it genuinely understand Romanized Khmer (Khmeringlish)?" : "តើប្រព័ន្ធពិតជាយល់ភាសាខ្មែរឡាតាំង (Khmeringlish) មែនឬទេ?",
              a: lang === "en"
                ? "Yes! TokoAI's Google Gemini models are specifically prompt-engineered to parse phonetic Romanized Khmer (e.g., 'kz castor', 'man stock ot', 'pro khos knea mx') into precise catalog inventory items."
                : "យល់បានយ៉ាងច្បាស់! TokoAI ប្រើប្រាស់ Google Gemini ដែលត្រូវបានបង្វឹកជាពិសេសដើម្បីយល់ពាក្យកាត់ និងការសរសេរជាអក្សរឡាតាំងរបស់អតិថិជនខ្មែរ។"
            },
            {
              q: lang === "en" ? "How does Bakong KHQR payment verification work?" : "តើការទូទាត់ប្រាក់តាម Bakong KHQR ដំណើរការយ៉ាងដូចម្តេច?",
              a: lang === "en"
                ? "When an order is created, TokoAI generates an EMVCo-compliant KHQR payload with a CRC-16 checksum matching your store's Bakong Merchant Account. Customers scan with ABA Mobile or any Bakong bank, and confirmation is instant."
                : "ពេលអតិថិជនបញ្ជាទិញ ប្រព័ន្ធបង្កើត QR កូដ Bakong ស្វ័យប្រវត្តដែលមានទឹកប្រាក់ជាក់លាក់។ អតិថិជនអាចស្កេនតាម ABA Mobile ឬធនាគារណាក៏បាន ហើយប្រព័ន្ធនឹងទទួលដំណឹងភ្លាមៗ។"
            },
            {
              q: lang === "en" ? "What happens if a customer asks a question the AI doesn't know?" : "ចុះបើអតិថិជនសួរអ្វីដែល AI មិនដឹង?",
              a: lang === "en"
                ? "TokoAI has strict hallucination safeguards. If confidence is low, it politely asks the customer to wait for human staff and flags the conversation with an urgent alert. You can click 'Pause AI & Take Over' anytime."
                : "TokoAI មានប្រព័ន្ធការពារសុវត្ថិភាព។ ប្រសិនបើសំណួរមិនមានក្នុងទិន្នន័យទំនិញ AI នឹងឆ្លើយតបយ៉ាងគួរសមឱ្យរង់ចាំបុគ្គលិក និងផ្ញើសារជូនដំណឹងទៅកាន់អ្នកភ្លាមៗ។"
            }
          ].map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-[#0F172A] hover:text-[#EA580C] transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. BOTTOM CALL TO ACTION                                 */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="bg-[#0F172A] rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)]">
          
          {/* Subtle background glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#EA580C]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {lang === "en" ? "Ready to Automate Your TikTok Sales?" : "ត្រៀមខ្លួនពង្រីកការលក់របស់អ្នកហើយឬនៅ?"}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {lang === "en"
                ? "Join 2,400+ Cambodian merchants who sleep peacefully while TokoAI converts midnight impulse buyers into paid orders."
                : "ចូលរួមជាមួយអ្នកលក់ជាង ២,៤០០+ នាក់នៅកម្ពុជាដែលគេងលក់ស្រួល ខណៈពេលដែល TokoAI បិទការលក់ជូនដោយស្វ័យប្រវត្ត។"}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <button className="h-12 px-8 rounded-full text-xs font-bold text-[#0F172A] bg-white hover:bg-slate-100 shadow-md transition-all flex items-center gap-2">
                  <span>{lang === "en" ? "Create Free Account" : "បង្កើតគណនីឥតគិតថ្លៃ"}</span>
                  <ArrowRight size={14} />
                </button>
              </Link>
              <Link href="/login">
                <button className="h-12 px-7 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all">
                  {lang === "en" ? "Sign In to Cockpit" : "ចូលទៅកាន់ Cockpit"}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. CLEAN MINIMALIST FOOTER                               */}
      {/* ========================================================= */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center text-white">
              <Sparkles size={12} />
            </div>
            <span className="font-bold text-[#0F172A]">TokoAI</span>
            <span>— Cambodia's Autonomous TikTok Commerce SaaS</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-slate-900 transition-colors">FAQs</a>
            <Link href="/login" className="hover:text-slate-900 transition-colors">Merchant Login</Link>
          </div>

          <div>
            © 2026 TokoAI. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
