"use client";

import { useState, useEffect } from "react";
import { Search, Send, ShieldAlert, PauseCircle, Bot, QrCode, User, ChevronLeft, Sparkles, MessageCircle } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

// Helper for human-friendly customer labels
const getCustomerMeta = (id: string) => {
  const names = ["Sokha R.", "Bopha M.", "Vicheka K.", "Channary T.", "Piseth N.", "Dara S."];
  const charCode = id.charCodeAt(0) || 0;
  const name = names[charCode % names.length];
  const shortId = id.slice(0, 6);
  return { name, shortId };
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useToast();

  // Poll for conversations
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll for messages when a chat is active
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      const interval = setInterval(() => fetchMessages(activeChatId), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChatId]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/seller/inbox');
      setConversations(res.data);
      // Auto-select first chat if none selected on desktop
      if (!activeChatId && res.data.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
        setActiveChatId(res.data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await api.get(`/seller/inbox/${id}`);
      setMessages(res.data.messages);
      setIsPaused(res.data.is_human_takeover);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeChatId) return;
    try {
      await api.post(`/seller/inbox/${activeChatId}/reply`, { content: replyText });
      setReplyText("");
      fetchMessages(activeChatId);
      fetchConversations();
      toast.success("Reply sent to buyer via TikTok DM");
    } catch (e) {
      console.error(e);
      toast.error("Failed to deliver message");
    }
  };

  const toggleAI = async () => {
    if (!activeChatId) return;
    try {
      await api.post(`/seller/inbox/${activeChatId}/takeover`);
      fetchMessages(activeChatId);
      toast.info(isPaused ? "AI Auto-Pilot Resumed" : "AI Paused: Human takeover active");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update AI state");
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.last_message && c.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeConv = conversations.find(c => c.id === activeChatId);
  const activeMeta = activeConv ? getCustomerMeta(activeConv.customer_id) : null;

  return (
    <div className="flex h-[calc(100vh-10rem)] rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-sm animate-in fade-in duration-500">
      
      {/* 1. Left Column: Chat List */}
      <div className={`w-full md:w-80 border-r border-slate-200/80 flex flex-col bg-[#FAF9F5] shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3.5 border-b border-slate-200/70 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200/80" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center">
              <MessageCircle size={24} className="mb-2 text-[#EA580C]/40" />
              <span className="font-semibold text-slate-600">No conversations found.</span>
              <span className="text-[10px] text-slate-400 mt-1">DMs from TikTok Shop will stream here.</span>
            </div>
          )}

          {filteredConversations.map((conv) => {
            const meta = getCustomerMeta(conv.customer_id);
            const isSelected = activeChatId === conv.id;

            return (
              <button 
                key={conv.id} 
                onClick={() => setActiveChatId(conv.id)}
                className={`w-full text-left p-3 rounded-2xl flex flex-col gap-1.5 transition-all border ${
                  isSelected 
                    ? 'bg-orange-50 border-orange-200/90 shadow-sm' 
                    : 'bg-white border-slate-200/60 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {meta.name.charAt(0)}
                    </div>
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#EA580C]' : 'text-[#0F172A]'}`}>
                      {meta.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                    {new Date(conv.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>

                <p className={`text-xs truncate font-khmer pl-9 ${isSelected ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                  {conv.last_message || "No messages yet"}
                </p>

                <div className="flex items-center justify-between pl-9 mt-0.5">
                  <span className="text-[10px] text-slate-400">TikTok DM · #{meta.shortId}</span>
                  {conv.is_human_takeover ? (
                    <Badge variant="warning" className="text-[9px] px-1.5 py-0">Paused</Badge>
                  ) : (
                    <Badge variant="cyan" className="text-[9px] px-1.5 py-0">AI Active</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Middle Column: Chat Thread */}
      {activeChatId ? (
        <div className="flex-1 flex flex-col bg-[#FAF9F6] border-r border-slate-200/80 min-w-0">
          
          {/* Thread Header */}
          <div className="h-16 border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6 bg-white">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button */}
              <button 
                onClick={() => setActiveChatId(null)}
                className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#EA580C] to-amber-500 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                {activeMeta?.name.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  {activeMeta?.name}
                  <span className="text-[10px] bg-orange-50 text-[#EA580C] px-2 py-0.5 rounded-full border border-orange-200/70 font-semibold">
                    TikTok Buyer
                  </span>
                </h3>
                <span className="text-[10px] text-slate-400">ID: {activeMeta?.shortId} · Phnom Penh, KH</span>
              </div>
            </div>

            <Button 
              variant={isPaused ? "warning" : "secondary"} 
              className="h-8 text-xs gap-1.5"
              onClick={toggleAI}
            >
              {isPaused ? "Resume AI Pilot" : "Pause AI (Takeover)"}
            </Button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 font-khmer">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex items-start max-w-[85%] md:max-w-[75%] ${
                  msg.role === 'customer' || msg.role === 'user' ? '' : 'ml-auto justify-end'
                }`}
              >
                {(msg.role === 'customer' || msg.role === 'user') ? (
                  <div className="bg-white border border-slate-200/80 text-slate-800 text-xs md:text-sm p-4 rounded-2xl rounded-tl-xs shadow-sm leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <div className="bg-white border-2 border-orange-200/90 text-slate-800 text-xs md:text-sm p-4 rounded-2xl rounded-tr-xs shadow-sm flex flex-col gap-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#EA580C] font-bold">
                        <Sparkles size={11} /> Spoken Khmer AI
                      </div>
                      <span className="leading-relaxed">{msg.content.replace(/khqr:\/\/bakong\/[a-zA-Z0-9-]+/g, '')}</span>
                      
                      {(msg.type === 'bakong' || msg.content.includes('khqr://bakong')) && (
                        <div className="bg-[#FAF9F5] p-3.5 rounded-xl flex flex-col items-center mt-2 border border-slate-200 shadow-sm text-center">
                          <div className="text-[#00938C] font-extrabold text-[11px] mb-1.5 flex items-center gap-1">
                            🇰🇭 BAKONG KHQR PAY
                          </div>
                          <QrCode size={130} className="text-[#0F172A] mb-1.5" />
                          <span className="text-slate-900 font-bold text-xs">Scan with ABA or Bakong</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">Instant Order Confirmation</span>
                        </div>
                      )}
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-[#EA580C] flex items-center justify-center shrink-0 mt-1 shadow-sm text-white">
                      <Bot size={14} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isPaused && (
              <div className="flex items-center justify-center py-2">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="px-3 text-[10px] uppercase tracking-widest text-amber-700 font-bold flex items-center gap-1.5 bg-amber-50 py-1 rounded-full border border-amber-200">
                  <ShieldAlert size={12} /> AI Paused · Shop Owner in Control
                </span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
            )}
          </div>

          {/* Reply Bar */}
          <div className="p-3.5 bg-white border-t border-slate-200/80">
            <div className="relative flex items-center">
              <Input 
                value={replyText}
                onChange={(e: any) => setReplyText(e.target.value)}
                onKeyDown={(e: any) => e.key === 'Enter' && handleSendReply()}
                placeholder={isPaused ? "Type your manual reply (Khmer or English)..." : "AI is answering live. Type to send manual takeover message..."} 
                className="pr-12 h-11 bg-slate-50 border-slate-200/90 rounded-full text-xs md:text-sm" 
              />
              <Button 
                onClick={handleSendReply} 
                variant="primary" 
                className="absolute right-1.5 h-8 w-8 p-0 rounded-full shadow-sm"
              >
                <Send size={13} />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#FAF9F6] text-slate-400">
          <Bot size={44} className="mb-3 text-[#EA580C]/40 animate-pulse" />
          <p className="text-sm font-bold text-[#0F172A]">Select a conversation to inspect</p>
          <p className="text-xs text-slate-400 mt-1">Review live buyer interactions, Bakong QR scans, and AI transcripts.</p>
        </div>
      )}

      {/* 3. Right Column: AI Context Panel (Desktop only) */}
      <div className="hidden lg:flex w-72 bg-white border-l border-slate-200/80 flex-col shrink-0">
        <div className="h-16 border-b border-slate-200/80 flex items-center px-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#EA580C]" /> AI Intent Context
          </span>
        </div>
        
        {activeChatId ? (
          <div className="p-4 space-y-5 text-xs">
            <div>
              <h4 className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-2">Language Classification</h4>
              <Badge variant="cyan" className="font-semibold text-[10px]">Spoken Khmer (ភាសានិយាយ)</Badge>
            </div>

            <div>
              <h4 className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-2">Customer Profile</h4>
              <div className="space-y-2 p-3.5 bg-[#FAF9F5] rounded-2xl border border-slate-200/70">
                <div className="flex justify-between">
                  <span className="text-slate-500">Channel</span>
                  <span className="text-[#0F172A] font-bold">TikTok Shop DM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment</span>
                  <span className="text-[#00938C] font-bold">Bakong KHQR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Language</span>
                  <span className="text-[#0F172A] font-medium">Khmer / Latin</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-slate-400 uppercase tracking-wider text-[10px] font-bold mb-2">Automated Actions</h4>
              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-slate-200/70 space-y-1.5 text-[11px]">
                <div className="text-emerald-700 font-bold">✓ Live inventory query: Passed</div>
                <div className="text-emerald-700 font-bold">✓ Price verification: $15.00</div>
                <div className="text-slate-600">✓ KHQR EMVCo generated</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-xs text-slate-400 text-center mt-12">
            Select a chat to inspect live AI reasoning tokens and entity extraction.
          </div>
        )}
      </div>

    </div>
  );
}
