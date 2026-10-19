"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui/design-system";
import { Bot, CheckCircle2, ChevronRight, MessageCircle, Smartphone, UploadCloud } from "lucide-react";
import api from "@/lib/api";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingText, setTrainingText] = useState("Initializing AI Core...");

  // Form State
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");

  const nextStep = () => setStep(s => s + 1);

  const startAITraining = () => {
    setIsTraining(true);
    let progress = 0;
    
    const intervals = [
      { p: 15, text: "Connecting to TikTok Shop API..." },
      { p: 35, text: "Ingesting initial product catalogue..." },
      { p: 60, text: "Fine-tuning conversational Khmer models..." },
      { p: 85, text: "Configuring Bakong payment webhooks..." },
      { p: 100, text: "AI is ready to sell." },
    ];

    const timer = setInterval(() => {
      progress += 5;
      setTrainingProgress(progress);
      
      const currentStatus = intervals.findLast(i => progress >= i.p);
      if (currentStatus) setTrainingText(currentStatus.text);

      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <Bot size={24} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to TokoAI</h1>
          <p className="text-sm text-zinc-500 mt-2">Let's set up your autonomous E-Commerce engine.</p>
        </div>

        {/* Wizard Container */}
        <Card className="p-8 border-[#222] bg-black shadow-2xl relative overflow-hidden">
          
          {/* Step 1: Connect Platforms */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-lg font-semibold text-white">Step 1: Connect your Channels</h2>
                <p className="text-xs text-zinc-400 mt-1">Where do your customers message you?</p>
              </div>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-[#333] hover:border-emerald-500/50 bg-[#0A0A0A] hover:bg-[#111] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white border border-[#222]">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">TikTok Shop</p>
                      <p className="text-[10px] text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10}/> Connected</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="h-8 text-xs text-zinc-500">Manage</Button>
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-[#222] hover:border-[#444] bg-[#0A0A0A] hover:bg-[#111] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <MessageCircle size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Facebook Messenger</p>
                      <p className="text-[10px] text-zinc-500">Not connected</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400">Connect &rarr;</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-[#222] hover:border-[#444] bg-[#0A0A0A] hover:bg-[#111] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                      <Smartphone size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Instagram Direct</p>
                      <p className="text-[10px] text-zinc-500">Not connected</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-400">Connect &rarr;</span>
                </button>
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={nextStep} className="gap-2">Continue <ChevronRight size={16}/></Button>
              </div>
            </div>
          )}

          {/* Step 2: First Product */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-lg font-semibold text-white">Step 2: Add Your First Product</h2>
                <p className="text-xs text-zinc-400 mt-1">Give the AI something to sell. One product is enough to start.</p>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#333] hover:border-[#555] bg-[#0A0A0A] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                  <div className="w-12 h-12 bg-[#111] rounded-full flex items-center justify-center mb-3">
                    <UploadCloud size={20} className="text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-white">Upload Product Photo</p>
                  <p className="text-xs text-zinc-500 mt-1">Our Vision AI will auto-extract the details.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Product Name</label>
                    <Input 
                      placeholder="e.g. AirPods Pro" 
                      value={productName} 
                      onChange={(e: any) => setProductName(e.target.value)}
                      className="bg-[#0A0A0A]" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Price (USD)</label>
                    <Input 
                      type="number"
                      placeholder="250.00" 
                      value={productPrice} 
                      onChange={(e: any) => setProductPrice(e.target.value)}
                      className="bg-[#0A0A0A]" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-400">Back</Button>
                <Button onClick={nextStep} className="gap-2">Train AI <Bot size={16}/></Button>
              </div>
            </div>
          )}

          {/* Step 3: AI Training Simulator (The Psychological Masterclass) */}
          {step === 3 && (
            <div className="space-y-8 py-8 animate-in zoom-in-95 duration-700 flex flex-col items-center text-center">
              
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-[#222] rounded-full"></div>
                <div 
                  className="absolute inset-0 border-4 border-emerald-500 rounded-full transition-all duration-300"
                  style={{ clipPath: `polygon(0 0, 100% 0, 100% ${trainingProgress}%, 0 ${trainingProgress}%)` }}
                ></div>
                {isTraining ? (
                  <Bot size={32} className="text-emerald-400 animate-pulse" />
                ) : (
                  <Button variant="primary" onClick={startAITraining}>Initialize</Button>
                )}
              </div>

              {isTraining && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">{trainingProgress}%</h3>
                  <p className="text-sm text-zinc-400 animate-pulse">{trainingText}</p>
                </div>
              )}
              
              {!isTraining && (
                <div>
                  <h3 className="text-lg font-bold text-white">Ready for Boot Sequence</h3>
                  <p className="text-xs text-zinc-500 mt-2 max-w-xs mx-auto">
                    TokoAI will now scan your inventory, generate embedding vectors, and spin up your dedicated ARQ worker.
                  </p>
                </div>
              )}

            </div>
          )}

        </Card>
      </div>
    </div>
  );
}
