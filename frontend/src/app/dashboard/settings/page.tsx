"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ToggleLeft, ToggleRight, Sparkles, CreditCard, Shield, Users, RefreshCw } from "lucide-react";
import { Button, Card, Input, Textarea, Badge } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [tone, setTone] = useState('Friendly');
  const [aiTrustMode, setAiTrustMode] = useState('BALANCED');
  const [dualCurrency, setDualCurrency] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Billing state
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState(50);
  const [tier, setTier] = useState("FREE");

  // Staff state
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/seller/settings');
      setTone(res.data.bot_tone || 'Friendly');
      setAiTrustMode(res.data.ai_trust_mode || 'BALANCED');
      setIsActive(res.data.is_active ?? true);
      setUsage(res.data.ai_token_usage || 0);
      setLimit(res.data.ai_message_limit || 50);
      setTier(res.data.subscription_tier || "FREE");
    } catch(e) {
      console.error(e);
      toast.error("Failed to load shop settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/seller/settings', {
        bot_tone: tone,
        ai_trust_mode: aiTrustMode,
        is_active: isActive
      });
      toast.success("AI safeguards & bot settings saved!");
    } catch(e) {
      console.error(e);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteStaff = async () => {
    if (!staffEmail || staffPassword.length < 8) {
      toast.warning("Valid email and 8+ char temporary password required.");
      return;
    }
    setIsInviting(true);
    try {
      await api.post('/auth/invite', { 
        email: staffEmail, 
        password: staffPassword, 
        shop_id: (user as any)?.shop_id || undefined 
      });
      toast.success(`Staff agent ${staffEmail} invited successfully!`);
      setStaffEmail("");
      setStaffPassword("");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to invite staff agent.");
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) return (
    <div className="p-12 text-center text-xs text-slate-400">
      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#EA580C]" />
      Loading shop configurations...
    </div>
  );

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
            Shop Settings & AI Safeguards
          </h1>
          <Badge variant="brand" className="text-[10px]">Autopilot Controls</Badge>
        </div>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Tune conversational Khmer tone, autonomous Bakong checkout limits, and staff roles.
        </p>
      </div>

      {/* Subscription & Billing */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <CreditCard size={14} className="text-[#EA580C]" /> Subscription & Quota
        </h2>
        <Card className="p-6 border border-slate-200/80 bg-white shadow-sm rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F172A]">{tier} Merchant Tier</h3>
              <Badge variant="brand" className="text-[9px]">Active</Badge>
            </div>
            <p className="text-xs text-slate-500">
              AI Messages Handled: <span className={usage >= limit ? "text-rose-600 font-bold" : "text-[#0F172A] font-extrabold tabular-nums"}>{usage}</span> / {limit}
            </p>
            {/* Progress bar */}
            <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-[#EA580C] rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (usage / limit) * 100)}%` }}
              />
            </div>
            {usage >= limit && (
              <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mt-1">
                Monthly quota reached. Auto-replies paused.
              </p>
            )}
          </div>
          <Button variant="primary" className="text-xs h-9 px-4 shrink-0">
            Upgrade via ABA Payway 🇰🇭
          </Button>
        </Card>
      </div>

      {/* AI Bot Tone */}
      <div className="space-y-3 pt-6 border-t border-slate-200/80">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Sparkles size={14} className="text-[#EA580C]" /> Spoken Khmer Tone (ភាសានិយាយ)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'Friendly', label: 'Friendly (រួសរាយ)', desc: 'Warm, polite, uses បាទ/ចាស៎ & gentle particles' },
            { id: 'Professional', label: 'Direct (រហ័ស)', desc: 'Short, efficient, fast specs and price quotes' },
            { id: 'Gen-Z', label: 'Gen-Z (យុវវ័យ)', desc: 'Authentic TikTok slang, emojis & playful vibe' }
          ].map(t => {
            const isSelected = tone.toLowerCase() === t.id.toLowerCase();
            return (
              <Card 
                key={t.id} 
                className={`p-4 cursor-pointer transition-all rounded-2xl ${
                  isSelected 
                    ? 'border-2 border-[#EA580C] bg-orange-50/50 shadow-sm' 
                    : 'border border-slate-200/80 bg-white hover:border-slate-300'
                }`}
                onClick={() => setTone(t.id)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-[#EA580C]' : 'text-slate-800'}`}>{t.label}</span>
                  {isSelected && <CheckCircle2 size={16} className="text-[#EA580C]" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">{t.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* AI Trust Engine */}
      <div className="space-y-3 pt-6 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Shield size={14} className="text-emerald-700" /> AI Trust Engine Safeguards
          </h2>
          <Badge variant="success" className="text-[9px]">TokoAI Proprietary</Badge>
        </div>
        <p className="text-xs text-slate-500">Choose how much autonomous authority Gemini has to close sales and generate QR codes.</p>
        
        <div className="grid gap-3">
          {[
            { id: 'CAUTIOUS', title: 'Cautious (Draft Only)', desc: 'AI prepares responses and KHQR codes as drafts, but requires owner swipe-to-send.' },
            { id: 'BALANCED', title: 'Balanced Autonomy (Recommended)', desc: 'Auto-replies to inquiries & stock checks; requests approval only on high-value items (>$100).' },
            { id: 'AUTOPILOT', title: 'Full Autopilot 24/7', desc: '100% autonomous. Closes sales at 2 AM, issues Bakong KHQR, and books J&T waybills.' }
          ].map(mode => {
            const isSelected = aiTrustMode === mode.id;
            return (
              <Card 
                key={mode.id} 
                className={`p-4 cursor-pointer transition-all flex items-center justify-between rounded-2xl ${
                  isSelected 
                    ? 'border-2 border-emerald-600 bg-emerald-50/40 shadow-sm' 
                    : 'border border-slate-200/80 bg-white hover:border-slate-300'
                }`}
                onClick={() => setAiTrustMode(mode.id)}
              >
                <div className="pr-4">
                  <span className={`text-xs font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>{mode.title}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">{mode.desc}</p>
                </div>
                {isSelected && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dual Currency Switcher */}
      <div className="pt-6 border-t border-slate-200/80">
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div>
            <h3 className="text-xs font-bold text-[#0F172A]">Dual Currency Display ($USD / ៛KHR)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              AI automatically quotes prices in both US Dollars and Khmer Riel using 4,000 KHR exchange rate.
            </p>
          </div>
          <button 
            onClick={() => setDualCurrency(!dualCurrency)} 
            className="p-1 focus:outline-none transition-colors"
          >
            {dualCurrency ? <ToggleRight size={32} className="text-[#EA580C]" /> : <ToggleLeft size={32} className="text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Staff Management */}
      <div className="space-y-3 pt-6 border-t border-slate-200/80">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Users size={14} className="text-[#EA580C]" /> Staff Agent Access
        </h2>
        <p className="text-xs text-slate-500">
          Invite team members to handle manual customer chat takeovers. Staff cannot access billing or integrations.
        </p>
        
        <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input 
              placeholder="Staff Email (e.g. staff@shop.com)" 
              value={staffEmail}
              onChange={(e: any) => setStaffEmail(e.target.value)}
              className="flex-1 text-xs"
            />
            <Input 
              type="password"
              placeholder="Temporary Password (8+ chars)" 
              value={staffPassword}
              onChange={(e: any) => setStaffPassword(e.target.value)}
              className="flex-1 text-xs"
            />
            <Button 
              variant="primary" 
              className="text-xs h-10 px-4 shrink-0 shadow-sm" 
              onClick={handleInviteStaff}
              disabled={isInviting}
            >
              {isInviting ? "Inviting..." : "Invite Agent"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <Button
          onClick={handleSave}
          variant="primary"
          className="w-full h-11 text-sm font-bold"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Settings & Update AI Core"}
        </Button>
      </div>

    </div>
  );
}
