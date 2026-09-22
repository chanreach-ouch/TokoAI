"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button, Card, Textarea } from "@/components/ui/design-system";
import api from "@/lib/api";

export default function SettingsPage() {
  const [tone, setTone] = useState('Friendly');
  const [dualCurrency, setDualCurrency] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/seller/settings');
      setTone(res.data.bot_tone);
      setIsActive(res.data.is_active);
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
      <div>
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
      
      <Button onClick={handleSave} className="w-full">Save Changes</Button>
    </div>
  );
}
