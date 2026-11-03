"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail, CheckCircle2, Sparkles, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button, Input } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Register seller
      await api.post("/auth/register", { email, password });
      
      // 2. Auto-login to obtain session token
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("tokoai_token", res.data.access_token);
      
      toast.success("Account created successfully! Welcome to TokoAI.");
      // 3. Forward to Onboarding Wizard for setup
      router.push("/onboarding");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*#?&]/.test(password);
  const isValidPassword = hasLength && hasLetter && hasNumber && hasSpecial;

  return (
    <div className="min-h-screen bg-[#1B38A6] text-[#0F172A] flex flex-col items-center justify-center p-4 selection:bg-[#1B38A6]/20 selection:text-[#1B38A6] font-sans relative overflow-hidden">
      
      {/* Background Decorative Rings */}
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
          <h1 className="text-2xl font-black tracking-tight text-white">Create Seller Account</h1>
          <p className="text-xs text-blue-100/80 max-w-xs mx-auto">
            Automate your TikTok Shop direct messages in native spoken Khmer (`ភាសានិយាយ`).
          </p>
        </div>

        {/* Register Card */}
        <div className="p-7 md:p-8 bg-white border border-slate-200/80 rounded-3xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.25)] space-y-5">
          <form onSubmit={handleRegister} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail size={13} className="text-[#1B38A6]" /> Store Email Address
              </label>
              <Input 
                type="email" 
                placeholder="store@domain.com" 
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required 
                className="text-xs md:text-sm bg-slate-50 border-slate-200 focus:bg-white rounded-xl h-11"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock size={13} className="text-[#1B38A6]" /> Password
              </label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create a strong password"
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

              {/* Password criteria indicators */}
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[10px]">
                <span className={`flex items-center gap-1 ${hasLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 size={11} className={hasLength ? 'text-emerald-600' : 'text-slate-300'} /> 8+ Characters
                </span>
                <span className={`flex items-center gap-1 ${hasLetter ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 size={11} className={hasLetter ? 'text-emerald-600' : 'text-slate-300'} /> At least 1 letter
                </span>
                <span className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 size={11} className={hasNumber ? 'text-emerald-600' : 'text-slate-300'} /> At least 1 number
                </span>
                <span className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                  <CheckCircle2 size={11} className={hasSpecial ? 'text-emerald-600' : 'text-slate-300'} /> Special symbol (@$!%*#?&)
                </span>
              </div>
            </div>

            <Button 
              type="submit" 
              variant="brand" 
              className="w-full h-11 text-xs font-bold tracking-wide mt-2 shadow-sm rounded-xl"
              disabled={isLoading || !isValidPassword}
            >
              {isLoading ? "Provisioning..." : "Create Free Account"} <ArrowRight size={14} className="ml-1" />
            </Button>
          </form>

          {/* Trust Footnote */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" /> 50 Free Messages Included
            </span>
            <span>No credit card required</span>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-blue-100 font-medium">
          Already selling with TokoAI?{" "}
          <Link href="/login" className="text-white hover:underline font-bold ml-1">
            Log in
          </Link>
        </p>

      </div>
    </div>
  );
}
