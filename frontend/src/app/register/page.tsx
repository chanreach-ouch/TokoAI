"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail, CheckCircle2 } from "lucide-react";
import { Button, Input } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Register the seller
      await api.post("/auth/register", { email, password });
      
      // Auto-login to get the token
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("tokoai_token", res.data.access_token);
      
      toast.success("Account created successfully! Welcome to TokoAI.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-ink flex flex-col items-center justify-center p-4 selection:bg-brand-pink/30 selection:text-white font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-brand-pink/15 to-brand-cyan/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10 space-y-6">
        
        {/* Logo and Heading */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-extrabold text-lg shadow-glow group-hover:scale-105 transition-transform">
              T
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">TokoAI</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-white">Create Seller Account</h1>
          <p className="text-xs text-zinc-400">Automate your TikTok Shop direct sales in spoken Khmer</p>
        </div>

        {/* Form Card */}
        <div className="p-6 md:p-8 bg-brand-ink-2/90 backdrop-blur-xl border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleRegister} className="space-y-4">
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
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Lock size={13} className="text-brand-cyan" /> Password
              </label>
              <Input 
                type="password" 
                placeholder="At least 8 chars (letter, number, symbol)"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"
                title="Must be at least 8 characters, contain a letter, a number, and a special character"
                required 
                className="text-xs"
              />
              <p className="text-[10px] text-zinc-400">
                Requires minimum 8 characters with a letter, number, & symbol.
              </p>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-11 text-xs font-bold uppercase tracking-wider mt-2 shadow-glow"
              disabled={isLoading}
            >
              {isLoading ? "Provisioning..." : "Create Free Account"} <ArrowRight size={14} className="ml-1" />
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-400">
          Already selling on TikTok?{" "}
          <Link href="/login" className="text-brand-pink hover:underline font-semibold ml-1">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
