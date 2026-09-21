"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [botTone, setBotTone] = useState("Professional");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("/seller/settings")
      .then((res) => {
        setBotTone(res.data.bot_tone);
        setIsActive(res.data.is_active);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await api.post("/seller/settings", { bot_tone: botTone, is_active: isActive });
      alert("Settings saved successfully!");
    } catch (err) {
      alert("Failed to save settings.");
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">AI Settings</h1>
      <p className="text-muted-foreground mb-8">
        Control how your Gemini AI agent behaves and communicates with your customers.
      </p>

      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Bot Personality / Tone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Select the tone of voice the AI should use when replying to TikTok messages.
          </p>
          <select 
            value={botTone}
            onChange={(e) => setBotTone(e.target.value)}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="Professional">Professional (Formal & Polite)</option>
            <option value="Friendly">Friendly (Casual & Warm)</option>
            <option value="Gen-Z">Gen-Z (Trendy & Use Emojis)</option>
          </select>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">AI Agent Status</h3>
            <p className="text-sm text-muted-foreground">
              Turn the AI auto-reply on or off. If turned off, the AI will ignore incoming messages.
            </p>
          </div>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isActive ? 'bg-primary' : 'bg-input'}`}
          >
            <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
