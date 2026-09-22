"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { Button, Input } from "@/components/ui/design-system";
import api from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@tokoai.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("tokoai_token", res.data.access_token);
      router.push("/dashboard/analytics");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 selection:bg-zinc-800 selection:text-white font-sans">
      <div className="w-full max-w-[360px] space-y-6">
        <div className="flex flex-col space-y-2 text-left mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Bot size={18} className="text-black" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-white">TokoAI</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Log in to your account</h1>
          <p className="text-sm text-zinc-500">Enter your credentials to access your dashboard.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-3 rounded-md text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Email address</label>
            <Input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Password</label>
            <Input 
              type="password" 
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required 
            />
          </div>
          <Button type="submit" className="w-full mt-4">Sign In</Button>
        </form>
      </div>
    </div>
  );
}
