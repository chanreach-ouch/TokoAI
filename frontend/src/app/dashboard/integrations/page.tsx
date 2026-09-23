"use client";

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { Button, Input, Card } from "@/components/ui/design-system";
import api from "@/lib/api";

export default function IntegrationsPage() {
  const [tiktokId, setTiktokId] = useState("");
  const [bakongId, setBakongId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await api.get('/seller/integrations');
      setTiktokId(res.data.tiktok_page_id || "");
      setBakongId(res.data.bakong_merchant_id || "");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTikTok = async () => {
    setIsSaving(true);
    try {
      await api.post('/seller/integrations', { tiktok_page_id: tiktokId });
      alert("TikTok Page ID saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save TikTok ID.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBakong = async () => {
    setIsSaving(true);
    try {
      await api.post('/seller/integrations', { bakong_merchant_id: bakongId });
      alert("Bakong Merchant ID saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save Bakong ID.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-zinc-500">Loading integrations...</div>;

  return (
    <div className="max-w-2xl space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-semibold tracking-tight text-white mb-6">Integrations</h2>
      
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4 border-b border-[#222] pb-4">
          <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-black font-bold">d</div>
          <div>
            <h3 className="text-sm font-medium text-white">TikTok Shop</h3>
            <p className="text-xs text-zinc-500">Connect to read and reply to messages.</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">Page ID</label>
          <Input 
            value={tiktokId} 
            onChange={(e: any) => setTiktokId(e.target.value)} 
            placeholder="TT-..."
          />
        </div>
        <Button 
          variant="secondary" 
          className="w-full" 
          onClick={handleUpdateTikTok}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Update Connection"}
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4 border-b border-[#222] pb-4">
          <div className="w-10 h-10 bg-red-600 rounded-md flex items-center justify-center text-white"><Activity size={20} /></div>
          <div>
            <h3 className="text-sm font-medium text-white">Bakong KHQR</h3>
            <p className="text-xs text-zinc-500">Generate dynamic payment QR codes in chat.</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">Merchant ID</label>
          <Input 
            type="password" 
            value={bakongId} 
            onChange={(e: any) => setBakongId(e.target.value)} 
            placeholder="BKG-..."
          />
        </div>
        <Button 
          variant="secondary" 
          className="w-full" 
          onClick={handleUpdateBakong}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Update Connection"}
        </Button>
      </Card>
    </div>
  );
}
