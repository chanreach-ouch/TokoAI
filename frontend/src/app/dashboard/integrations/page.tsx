"use client";

import { Activity } from "lucide-react";
import { Button, Input, Card } from "@/components/ui/design-system";

export default function IntegrationsPage() {
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
          <Input defaultValue="TT-8934729834" />
        </div>
        <Button variant="secondary" className="w-full">Update Connection</Button>
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
          <Input type="password" defaultValue="BKG-*****************" />
        </div>
        <Button variant="secondary" className="w-full">Update Connection</Button>
      </Card>
    </div>
  );
}
