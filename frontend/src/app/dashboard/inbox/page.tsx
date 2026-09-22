"use client";

import { useState, useEffect } from "react";
import { Search, Send, ShieldAlert, PauseCircle, Bot, QrCode } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui/design-system";
import api from "@/lib/api";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isPaused, setIsPaused] = useState(false);

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
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAI = async () => {
    if (!activeChatId) return;
    try {
      await api.post(`/seller/inbox/${activeChatId}/takeover`);
      fetchMessages(activeChatId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden bg-black border border-[#222] shadow-2xl animate-in fade-in duration-500">
      {/* 1. Left Column: Chat List */}
      <div className="w-80 border-r border-[#222] flex flex-col bg-[#000]">
        <div className="p-4 border-b border-[#222]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
            <Input placeholder="Search messages..." className="pl-9 h-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <div className="p-4 text-center text-xs text-zinc-500">No active conversations.</div>
          )}
          {conversations.map((conv) => (
            <button 
              key={conv.id} 
              onClick={() => setActiveChatId(conv.id)}
              className={`w-full text-left px-3 py-3 rounded-lg flex flex-col gap-1.5 transition-colors border ${
                activeChatId === conv.id ? 'bg-[#111] border-[#333]' : 'border-transparent hover:bg-[#0A0A0A]'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className={`text-sm ${activeChatId === conv.id ? 'text-white font-medium' : 'text-zinc-400 font-normal'}`}>
                  Customer {conv.customer_id.slice(0,6)}
                </span>
                <span className="text-[11px] text-zinc-500 tabular-nums">
                  {new Date(conv.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className={`text-xs truncate ${activeChatId === conv.id ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {conv.last_message}
              </p>
              <div className="mt-1">
                {conv.is_human_takeover ? <Badge variant="warning">AI Paused</Badge> : <Badge variant="success">AI Active</Badge>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Middle Column: Chat Thread */}
      {activeChatId ? (
        <div className="flex-1 flex flex-col bg-[#050505] border-r border-[#222]">
          <div className="h-14 border-b border-[#222] flex items-center justify-between px-6 bg-black">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#111] border border-[#333] flex items-center justify-center font-medium text-xs text-white">CT</div>
              <h3 className="text-sm font-medium text-white flex items-center gap-2">Customer Chat</h3>
            </div>
            <Button 
              variant={isPaused ? "warning" : "secondary"} 
              className="h-8 text-xs"
              onClick={toggleAI}
            >
              {isPaused ? "Resume AI" : "Pause AI (Takeover)"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start max-w-[80%] ${msg.role === 'customer' || msg.role === 'user' ? '' : 'ml-auto justify-end'}`}>
                {(msg.role === 'customer' || msg.role === 'user') ? (
                  <div className="bg-[#111] border border-[#222] text-zinc-200 text-sm p-3 rounded-2xl rounded-tl-sm shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  <>
                    <div className="bg-transparent border border-[#333] text-zinc-300 text-sm p-3 rounded-2xl rounded-tr-sm flex flex-col items-center gap-3">
                      <span>{msg.content}</span>
                      {msg.type === 'bakong' && (
                        <div className="bg-white p-3 rounded-xl flex flex-col items-center mt-2">
                          <QrCode size={120} className="text-black mb-2" />
                          <span className="text-black font-bold text-xs uppercase">Scan to Pay</span>
                        </div>
                      )}
                    </div>
                    <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                      <Bot size={12} className="text-black" />
                    </div>
                  </>
                )}
              </div>
            ))}

            {isPaused && (
              <div className="flex items-center justify-center py-2">
                <div className="h-[1px] bg-[#333] flex-1"></div>
                <span className="px-4 text-[10px] uppercase tracking-widest text-amber-500 font-bold flex items-center gap-2">
                  <ShieldAlert size={12} /> AI Paused · Human Takeover
                </span>
                <div className="h-[1px] bg-[#333] flex-1"></div>
              </div>
            )}
          </div>

          <div className="p-4 bg-black border-t border-[#222]">
            <div className="relative flex items-center">
              <Input 
                value={replyText}
                onChange={(e: any) => setReplyText(e.target.value)}
                onKeyDown={(e: any) => e.key === 'Enter' && handleSendReply()}
                placeholder={isPaused ? "Type your manual reply..." : "AI is active. Send a message to auto-pause..."} 
                className="pr-12 h-11 bg-[#0A0A0A] rounded-xl" 
              />
              <Button onClick={handleSendReply} variant="primary" className="absolute right-1.5 h-8 w-8 p-0 rounded-lg">
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] border-r border-[#222] text-zinc-600">
          <Bot size={48} className="mb-4 opacity-20" />
          <p className="text-sm">Select a conversation to view history.</p>
        </div>
      )}

      {/* 3. Right Column: AI Context Panel */}
      <div className="w-72 bg-[#000] flex flex-col">
        <div className="h-14 border-b border-[#222] flex items-center px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">AI Context</span>
        </div>
        
        {activeChatId ? (
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Detected Intent</h4>
              <Badge variant="warning">Inference Active</Badge>
            </div>
            <div>
              <h4 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Customer Profile</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">Platform</span><span className="text-white">TikTok Shop</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Lifetime Value</span><span className="text-white">$0.00</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-xs text-zinc-600 text-center mt-10">No context available</div>
        )}
      </div>
    </div>
  );
}
