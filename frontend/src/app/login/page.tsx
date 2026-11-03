"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Lock, Mail, Eye, EyeOff, ShieldCheck, Zap } from "lucide-react";
import { Button, Input } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@tokoai.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      toast.success("Welcome back to TokoAI!");
      login(res.data.access_token);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@tokoai.com");
    setPassword("admin123");
    toast.info("Demo credentials loaded!");
  };

  return (
    <div className="min-h-screen bg-[#1B38A6] text-[#0F172A] flex flex-col items-center justify-center p-4 selection:bg-[#1B38A6]/20 selection:text-[#1B38A6] font-sans relative overflow-hidden">
      
      {/* Background Decorative Rings matching Rubick Design */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1B38A6] shadow-lg group-hover:scale-105 transition-transform">
              <Sparkles size={20} className="fill-[#1B38A6]/20" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-white">TokoAI</span>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold backdrop-blur-xs">
                KH
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-white">Merchant Cockpit</h1>
          <p className="text-xs text-blue-100/80 max-w-xs mx-auto">
            Log in to manage your autonomous TikTok sales bot and Bakong KHQR settlements.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="p-7 md:p-8 bg-white border border-slate-200/80 rounded-3xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.25)] space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail size={13} className="text-[#1B38A6]" /> Seller Email Address
              </label>
              <Input 
                type="email" 
                placeholder="seller@shop.com" 
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required 
                className="text-xs md:text-sm bg-slate-50 border-slate-200 focus:bg-white rounded-xl h-11"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock size={13} className="text-[#1B38A6]" /> Password
                </label>
              </div>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required 
                  className="text-xs md:text-sm bg-slate-50 border-slate-200 focus:bg-white rounded-xl pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Pre-fill Pill */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleFillDemo}
                className="w-full py-2 px-3 rounded-xl bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-[#1B38A6] hover:bg-blue-100/70 transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap size={12} className="fill-[#1B38A6]" /> 1-Click Demo: admin@tokoai.com / admin123
              </button>
            </div>

            <Button 
              type="submit" 
              variant="brand" 
              className="w-full h-11 text-xs font-bold tracking-wide mt-2 shadow-sm rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Sign In to Cockpit"} <ArrowRight size={14} className="ml-1" />
            </Button>
          </form>

          {/* Trust Footnote */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" /> Bakong KHQR Verified
            </span>
            <span>256-bit SSL</span>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-blue-100 font-medium">
          New TikTok retailer in Cambodia?{" "}
          <Link href="/register" className="text-white hover:underline font-bold ml-1">
            Create an account
          </Link>
        </p>

      </div>
    </div>
  );
}
