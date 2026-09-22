"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  MessageSquare, ShoppingBag, Zap, DollarSign, Bot, Users, 
  CheckCircle2, ChevronDown, MessageCircle, Mail, Phone, ArrowRight,
  ShieldAlert, Clock, Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [isKhmer, setIsKhmer] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  
  // ROI Calculator State
  const [dailyDms, setDailyDms] = useState(50);
  const [avgOrderValue, setAvgOrderValue] = useState(15);
  const [conversionRate, setConversionRate] = useState(10);
  
  const monthlyRevenue = Math.round(dailyDms * 30 * (conversionRate / 100) * avgOrderValue);

  return (
    <div className="min-h-screen bg-brand-mist font-sans text-foreground overflow-x-hidden">
      
      {/* 1. Sticky Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-mist/80 backdrop-blur-md border-b border-brand-line">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white font-bold">T</div>
            <span className="text-xl font-bold tracking-tight">TokoAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-muted">
            <a href="#features" className="hover:text-brand-pink transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-pink transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-brand-pink transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsKhmer(!isKhmer)} 
              className="text-xs font-semibold px-2 py-1 bg-brand-line rounded-md hover:bg-brand-muted/20"
            >
              {isKhmer ? "KH" : "EN"}
            </button>
            <Link href="/login">
              <Button className="bg-gradient-primary text-white border-0 shadow-glow rounded-xl hover:opacity-90">
                {isKhmer ? "ចាប់ផ្តើមឥតគិតថ្លៃ" : "Start Free"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-32 pb-20 px-6 container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div className="inline-block px-4 py-1.5 rounded-full bg-brand-cyan/10 text-brand-cyan-dark text-sm font-bold border border-brand-cyan/20">
              {isKhmer ? "សមាហរណកម្ម Bakong ផ្លូវការ 🇰🇭" : "Official Bakong Integration 🇰🇭"}
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight">
              Your <span className="text-gradient">24/7 AI Sales Agent</span> for TikTok Shop
            </h1>
            <p className="text-lg text-brand-muted max-w-xl">
              Turn TikTok DMs into sales while you sleep. The only AI agent built for Cambodia that replies in fluent Khmer and generates Bakong QR codes directly in the chat.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/register">
                <Button className="h-14 px-8 text-lg bg-gradient-primary text-white border-0 shadow-glow rounded-xl hover:opacity-90">
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <div className="text-sm text-brand-muted">No credit card required.</div>
            </div>
          </div>
          
          {/* Hero Chat Mockup */}
          <div className="flex-1 w-full max-w-md bg-brand-bone rounded-2xl shadow-soft border border-brand-line p-4 relative">
            <div className="flex items-center justify-between border-b border-brand-line pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div>
                  <div className="font-semibold text-sm">Customer</div>
                  <div className="text-xs text-brand-cyan-dark flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan"></span>
                    </span>
                    AI Active
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="bg-brand-line text-foreground p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm">
                  តើអាវយឺតពណ៌ខ្មៅនេះមានស្តុកទេ? ចង់ទិញមួយ! (Is this black shirt in stock? Want to buy one!)
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-brand-ink text-white p-3 rounded-2xl rounded-tr-none max-w-[80%] text-sm relative">
                  <div className="absolute -top-3 -left-3 bg-brand-cyan w-6 h-6 rounded-full flex items-center justify-center shadow-glow">
                    <Bot className="w-4 h-4 text-brand-ink" />
                  </div>
                  បាទ/ចាស៎ មានស្តុក! តម្លៃ $15.00 (60,000៛)។ លោកអ្នកអាចស្កេន QR កូដ Bakong ខាងក្រោមដើម្បីទូទាត់ប្រាក់៖
                  <div className="mt-3 p-3 bg-white rounded-xl text-center">
                    <div className="text-[#00938C] font-bold text-xs mb-2 border-b pb-2">BAKONG PAY</div>
                    <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 mb-2">QR Code</div>
                    <div className="text-brand-ink font-bold">$15.00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Logo Cloud */}
      <section className="border-y border-brand-line bg-brand-bone py-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-6">Trusted by 500+ Cambodian TikTok Sellers</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
            {/* Placeholder SVGs for logos */}
            <div className="font-bold text-xl flex items-center gap-2"><ShoppingBag/> ShopKhmer</div>
            <div className="font-bold text-xl flex items-center gap-2"><DollarSign/> K-Beauty KH</div>
            <div className="font-bold text-xl flex items-center gap-2"><Users/> PhnomPenh Fashion</div>
            <div className="font-bold text-xl flex items-center gap-2"><Zap/> TechStore Cambodia</div>
          </div>
        </div>
      </section>

      {/* 4. Problem -> Solution */}
      <section className="py-24 container mx-auto px-6" id="features">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Stop losing sales in the DMs.</h2>
          <p className="text-brand-muted text-lg max-w-2xl mx-auto">TikTok Shop moves fast. If you don't reply in 5 minutes, the customer buys from your competitor. We solve the 3 biggest problems for sellers.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-brand-bone p-8 rounded-2xl border border-brand-line shadow-soft">
            <ShieldAlert className="w-10 h-10 text-brand-pink mb-6" />
            <h3 className="text-xl font-bold mb-3">High Volume Overload</h3>
            <p className="text-brand-muted">Viral videos bring hundreds of identical DMs asking "How much?". Manual replies can't keep up.</p>
          </div>
          <div className="bg-brand-bone p-8 rounded-2xl border border-brand-line shadow-soft">
            <Clock className="w-10 h-10 text-brand-pink mb-6" />
            <h3 className="text-xl font-bold mb-3">Response Time Penalty</h3>
            <p className="text-brand-muted">TikTok penalizes shops that reply late. TokoAI replies in 1.2 seconds, 24 hours a day.</p>
          </div>
          <div className="bg-brand-bone p-8 rounded-2xl border border-brand-line shadow-soft">
            <Coins className="w-10 h-10 text-brand-pink mb-6" />
            <h3 className="text-xl font-bold mb-3">Lost Conversions</h3>
            <p className="text-brand-muted">Customers drop off when switching apps to pay. We generate Bakong QRs right inside the TikTok chat.</p>
          </div>
        </div>
      </section>

      {/* 5. How it works */}
      <section className="py-24 bg-brand-ink text-white" id="how-it-works">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">3 Steps to Auto-Pilot</h2>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-brand-ink-2 z-0" />
            
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-brand-ink-2 rounded-2xl border border-brand-muted/30 flex items-center justify-center text-3xl font-bold mb-6 text-brand-cyan shadow-glow">1</div>
              <h3 className="text-2xl font-bold mb-2">Connect TikTok</h3>
              <p className="text-gray-400">Link your TikTok Shop securely with one click. No coding required.</p>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-brand-ink-2 rounded-2xl border border-brand-muted/30 flex items-center justify-center text-3xl font-bold mb-6 text-brand-cyan shadow-glow">2</div>
              <h3 className="text-2xl font-bold mb-2">Upload Products</h3>
              <p className="text-gray-400">Add your prices, images, and custom store rules to the AI Knowledge Base.</p>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto bg-brand-ink-2 rounded-2xl border border-brand-muted/30 flex items-center justify-center text-3xl font-bold mb-6 text-brand-cyan shadow-glow">3</div>
              <h3 className="text-2xl font-bold mb-2">AI Starts Selling</h3>
              <p className="text-gray-400">The Gemini AI instantly answers questions in Khmer and closes sales for you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Human in the Loop Demo */}
      <section className="py-24 container mx-auto px-6">
        <div className="bg-gradient-primary rounded-3xl p-1 md:p-12 shadow-glow text-white text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">You are never locked out.</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-10">
            If the AI gets stuck or a customer has a complex issue, just click one button to instantly pause the bot and take over the chat manually.
          </p>
          <div className="inline-flex items-center gap-4 bg-brand-ink p-4 rounded-2xl shadow-xl max-w-sm mx-auto">
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-gray-300">Customer: Vicheka_99</div>
              <div className="text-brand-cyan text-xs font-bold animate-pulse">● AI is typing...</div>
            </div>
            <Button className="bg-brand-pink hover:bg-brand-pink-dark text-white rounded-xl shadow-glow">
              Pause AI & Take Over
            </Button>
          </div>
        </div>
      </section>

      {/* 9. ROI Calculator */}
      <section className="py-24 bg-brand-bone border-y border-brand-line">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Calculate Your ROI</h2>
            <p className="text-brand-muted text-lg">See how much revenue you are missing out on while you sleep.</p>
          </div>
          
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-soft border border-brand-line p-8 md:p-12 grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <label className="flex justify-between text-sm font-bold mb-4">
                  <span>Daily TikTok DMs</span>
                  <span className="text-brand-pink">{dailyDms}</span>
                </label>
                <input type="range" min="10" max="1000" value={dailyDms} onChange={(e) => setDailyDms(Number(e.target.value))} className="w-full accent-brand-pink" />
              </div>
              <div>
                <label className="flex justify-between text-sm font-bold mb-4">
                  <span>Average Order Value ($)</span>
                  <span className="text-brand-pink">${avgOrderValue}</span>
                </label>
                <input type="range" min="1" max="100" value={avgOrderValue} onChange={(e) => setAvgOrderValue(Number(e.target.value))} className="w-full accent-brand-pink" />
              </div>
              <div>
                <label className="flex justify-between text-sm font-bold mb-4">
                  <span>Conversion Rate (%)</span>
                  <span className="text-brand-pink">{conversionRate}%</span>
                </label>
                <input type="range" min="1" max="50" value={conversionRate} onChange={(e) => setConversionRate(Number(e.target.value))} className="w-full accent-brand-pink" />
              </div>
            </div>
            
            <div className="bg-brand-ink rounded-2xl p-8 text-white flex flex-col justify-center items-center text-center">
              <div className="text-sm font-semibold text-gray-400 mb-2">Potential Monthly Revenue via AI</div>
              <div className="text-6xl font-extrabold text-brand-cyan mb-4">${monthlyRevenue.toLocaleString()}</div>
              <p className="text-sm opacity-80">Stop leaving money on the table. Let TokoAI capture every single lead instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Pricing */}
      <section className="py-24 container mx-auto px-6" id="pricing">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, transparent pricing.</h2>
          <div className="flex items-center justify-center gap-4">
            <span className={!isYearly ? "font-bold text-foreground" : "text-brand-muted"}>Monthly</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className={`w-14 h-7 rounded-full transition-colors flex items-center px-1 ${isYearly ? 'bg-brand-pink' : 'bg-brand-muted'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <span className={isYearly ? "font-bold text-foreground" : "text-brand-muted"}>Yearly (Save 20%)</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="bg-white rounded-3xl p-8 border border-brand-line shadow-soft flex flex-col">
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <div className="text-4xl font-extrabold mb-6">$0<span className="text-lg text-brand-muted font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan-dark"/> 1,000 AI Messages / mo</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan-dark"/> Bakong QR Integration</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan-dark"/> English & Khmer</li>
            </ul>
            <Button variant="outline" className="w-full rounded-xl h-12 border-brand-line">Start Free</Button>
          </div>
          
          {/* Pro */}
          <div className="bg-brand-ink text-white rounded-3xl p-8 shadow-glow flex flex-col relative transform md:-translate-y-4 border border-brand-pink/20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Most Popular</div>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="text-4xl font-extrabold mb-6 text-brand-cyan">${isYearly ? '24' : '29'}<span className="text-lg text-gray-400 font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan"/> 10,000 AI Messages / mo</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan"/> Advanced Knowledge Base</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan"/> Custom Bot Personality</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan"/> Priority Support</li>
            </ul>
            <Button className="w-full rounded-xl h-12 bg-brand-pink hover:bg-brand-pink-dark text-white border-0 shadow-glow">Get Pro</Button>
          </div>
          
          {/* Scale */}
          <div className="bg-white rounded-3xl p-8 border border-brand-line shadow-soft flex flex-col">
            <h3 className="text-xl font-bold mb-2">Scale</h3>
            <div className="text-4xl font-extrabold mb-6">${isYearly ? '79' : '99'}<span className="text-lg text-brand-muted font-normal">/mo</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan-dark"/> Unlimited Messages</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan-dark"/> Multi-shop support</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-brand-cyan-dark"/> Custom AI Fine-tuning</li>
            </ul>
            <Button variant="outline" className="w-full rounded-xl h-12 border-brand-line">Contact Sales</Button>
          </div>
        </div>
      </section>

      {/* 13. Final CTA */}
      <section className="bg-gradient-primary py-24 text-center text-white">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to scale your shop?</h2>
        <p className="text-xl opacity-90 mb-10">Join 500+ Cambodian sellers who sleep well knowing their AI is making money.</p>
        <Link href="/register">
          <Button className="bg-brand-ink text-white hover:bg-brand-ink-2 h-16 px-10 text-lg rounded-xl shadow-xl">
            Create Your Free Account
          </Button>
        </Link>
      </section>

      {/* 14. Footer */}
      <footer className="bg-brand-ink border-t border-gray-800 text-gray-400 py-12">
        <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white font-bold">T</div>
              <span className="text-xl font-bold text-white tracking-tight">TokoAI</span>
            </div>
            <p className="text-sm">The leading B2B SaaS for Cambodian TikTok Shop sellers powered by Google Gemini.</p>
            <div className="mt-4 flex items-center gap-2 text-[#00938C] font-bold text-xs bg-white/10 w-fit px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4"/> Bakong Certified Partner
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-pink transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-brand-pink transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand-pink transition-colors">Case Studies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-pink transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-brand-pink transition-colors flex items-center gap-2"><Mail className="w-4 h-4"/> Email Us</a></li>
              <li><a href="#" className="hover:text-brand-cyan transition-colors flex items-center gap-2"><Phone className="w-4 h-4"/> Telegram Group</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-pink transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-pink transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Mobile Telegram FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-brand-ink text-white p-4 rounded-full shadow-glow cursor-pointer hover:bg-brand-ink-2 transition-transform hover:scale-110 flex items-center justify-center">
          <MessageCircle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
