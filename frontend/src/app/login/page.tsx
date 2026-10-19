"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Lock, Mail } from "lucide-react";
import { Button, Input } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@tokoai.com");
  const [password, setPassword] = useState("admin123");
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

  return (
    <div className="min-h-screen bg-brand-ink flex flex-col items-center justify-center p-4 selection:bg-brand-pink/30 selection:text-white font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-brand-pink/15 to-brand-cyan/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10 space-y-6">
        
        {/* Logo and Heading */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-extrabold text-lg shadow-glow group-hover:scale-105 transition-transform">
              T
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">TokoAI</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="text-xs text-zinc-400">Sign in to monitor your autonomous TikTok sales bot</p>
        </div>

        {/* Form Card */}
        <div className="p-6 md:p-8 bg-brand-ink-2/90 backdrop-blur-xl border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Mail size={13} className="text-brand-pink" /> Email Address
              </label>
              <Input 
                type="email" 
                placeholder="seller@shop.com" 
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required 
                className="text-xs"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Lock size={13} className="text-brand-cyan" /> Password
                </label>
              </div>
              <Input 
                type="password" 
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required 
                className="text-xs"
              />
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-11 text-xs font-bold uppercase tracking-wider mt-2 shadow-glow"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Sign In to Cockpit"} <ArrowRight size={14} className="ml-1" />
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-400">
          New TikTok seller?{" "}
          <Link href="/register" className="text-brand-pink hover:underline font-semibold ml-1">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
