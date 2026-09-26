"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button, Card, Textarea } from "@/components/ui/design-system";
import api from "@/lib/api";

export default function SettingsPage() {
  const [tone, setTone] = useState('Friendly');
  const [aiTrustMode, setAiTrustMode] = useState('BALANCED');
  const [dualCurrency, setDualCurrency] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);
  
  // Billing state
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState(50);
  const [tier, setTier] = useState("FREE");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/seller/settings');
      setTone(res.data.bot_tone);
      setAiTrustMode(res.data.ai_trust_mode || 'BALANCED');
      setIsActive(res.data.is_active);
      setUsage(res.data.ai_token_usage || 0);
      setLimit(res.data.ai_message_limit || 50);
      setTier(res.data.subscription_tier || "FREE");
    } catch(e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.post('/seller/settings', {
        bot_tone: tone,
        ai_trust_mode: aiTrustMode,
        is_active: isActive
      });
      alert('Settings saved!');
    } catch(e) {
      console.error(e);
    }
  };

  if (isLoading) return <div className="p-8 text-zinc-500">Loading settings...</div>;

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-500">
      
      {/* Billing Section */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">Subscription & Billing</h2>
        <div className="p-5 bg-black border border-[#222] rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">{tier} Plan</h3>
            <p className="text-xs text-zinc-500 mt-1">
              AI Messages Used: <span className={usage >= limit ? "text-red-500 font-bold" : "text-white"}>{usage}</span> / {limit}
            </p>
            {usage >= limit && (
              <p className="text-[10px] text-red-500 mt-1 uppercase tracking-wider font-bold">Quota Exceeded. AI is paused.</p>
            )}
          </div>
          <Button variant="primary">Upgrade via ABA Payway</Button>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-[#222]">
        <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">AI Personality & Settings</h2>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white">Bot Tone</h3>
          <div className="grid grid-cols-3 gap-4">
            {['Friendly', 'Professional', 'Gen-Z'].map(t => (
              <Card 
                key={t} 
                className={`p-4 cursor-pointer transition-all ${tone.toLowerCase() === t.toLowerCase() ? 'border-white bg-[#111]' : 'hover:border-[#444]'}`}
                onClick={() => setTone(t)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${tone.toLowerCase() === t.toLowerCase() ? 'text-white' : 'text-zinc-400'}`}>{t}</span>
                  {tone.toLowerCase() === t.toLowerCase() && <CheckCircle2 size={16} className="text-white" />}
                </div>
                <p className="text-[10px] text-zinc-500">Optimized for {t.toLowerCase()} audience.</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-6">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            AI Trust Engine <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full uppercase tracking-wider">TokoAI Exclusive</span>
          </h3>
          <p className="text-xs text-zinc-500">Instead of complex rules, choose how much autonomy your AI has.</p>
          <div className="grid gap-3">
            {[
              { id: 'CAUTIOUS', title: 'Cautious (Draft Only)', desc: 'AI prepares drafts but requires your swipe-to-approve before sending.' },
              { id: 'BALANCED', title: 'Balanced (Recommended)', desc: 'AI auto-replies to FAQs but requires approval for payment generation.' },
              { id: 'AUTOPILOT', title: 'Full Autopilot', desc: 'AI fully autonomous. Cross-sells, creates Bakong QR, and generates waybills instantly.' }
            ].map(mode => (
              <Card 
                key={mode.id} 
                className={`p-4 cursor-pointer transition-all flex items-center justify-between ${aiTrustMode === mode.id ? 'border-white bg-[#111]' : 'hover:border-[#444]'}`}
                onClick={() => setAiTrustMode(mode.id)}
              >
                <div>
                  <span className={`text-sm font-medium ${aiTrustMode === mode.id ? 'text-white' : 'text-zinc-400'}`}>{mode.title}</span>
                  <p className="text-[11px] text-zinc-500 mt-1">{mode.desc}</p>
                </div>
                {aiTrustMode === mode.id && <CheckCircle2 size={18} className="text-white" />}
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-[#222]">
        <h3 className="text-sm font-medium text-white">Custom System Instructions</h3>
        <p className="text-xs text-zinc-500">Inject secret rules directly into the Gemini context window.</p>
        <Textarea defaultValue="Always greet the customer with 'Sousdey!'. Never offer discounts above 10% without human approval." />
      </div>

      <div className="space-y-4 pt-6 border-t border-[#222]">
        <div className="flex items-center justify-between p-4 bg-black border border-[#222] rounded-xl">
          <div>
            <h3 className="text-sm font-medium text-white">Dual Currency Display (USD/KHR)</h3>
            <p className="text-xs text-zinc-500">AI will automatically quote prices in both currencies based on current exchange rate.</p>
          </div>
          <button onClick={() => setDualCurrency(!dualCurrency)} className="text-white">
            {dualCurrency ? <ToggleRight size={32} className="text-emerald-500" /> : <ToggleLeft size={32} className="text-zinc-600" />}
          </button>
        </div>
      </div>
      
      <div className="space-y-4 pt-6 border-t border-[#222]">
        <div>
          <h3 className="text-sm font-medium text-white">Team Management</h3>
          <p className="text-xs text-zinc-500 mb-4">Invite staff agents to manage the AI Inbox. They will not have access to billing or settings.</p>
          
          <div className="flex items-center gap-3">
            <input id="staffEmail" placeholder="Staff Email Address" className="flex-1 bg-black border border-[#333] text-sm p-2.5 rounded-lg text-white" />
            <input id="staffPassword" placeholder="Temporary Password" type="password" className="flex-1 bg-black border border-[#333] text-sm p-2.5 rounded-lg text-white" />
            <Button onClick={async () => {
              const email = (document.getElementById('staffEmail') as HTMLInputElement).value;
              const password = (document.getElementById('staffPassword') as HTMLInputElement).value;
              if(!email || password.length < 8) return alert("Valid email and 8+ char password required.");
              try {
                // Hardcoded shop_id for demo, in real life fetch from profile
                await api.post('/auth/invite', { email, password, shop_id: "00000000-0000-0000-0000-000000000000" });
                alert("Staff invited successfully!");
              } catch (e: any) {
                alert("Failed to invite staff: " + e.response?.data?.detail);
              }
            }} variant="secondary">Invite Agent</Button>
          </div>
        </div>
      </div>
      
      <Button onClick={handleSave} className="w-full">Save Changes</Button>
    </div>
  );
}
