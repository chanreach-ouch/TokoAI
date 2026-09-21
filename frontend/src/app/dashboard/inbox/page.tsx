"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  customer_id: string;
  is_human_takeover: boolean;
  last_message: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const fetchConversations = async () => {
    try {
      const res = await api.get("/seller/inbox");
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await api.get(`/seller/inbox/${id}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSelectConv = (c: Conversation) => {
    setActiveConv(c);
    fetchMessages(c.id);
  };

  const toggleTakeover = async () => {
    if (!activeConv) return;
    try {
      const res = await api.post(`/seller/inbox/${activeConv.id}/takeover`);
      setActiveConv({ ...activeConv, is_human_takeover: res.data.is_human_takeover });
      
      // Update in the list as well
      setConversations(conversations.map(c => 
        c.id === activeConv.id ? { ...c, is_human_takeover: res.data.is_human_takeover } : c
      ));
    } catch (err) {
      alert("Failed to toggle takeover mode");
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar: Conversation List */}
      <div className="w-80 border-r bg-card flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b font-semibold">Active Chats</div>
        {conversations.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No active chats.</div>
        ) : (
          conversations.map(c => (
            <div 
              key={c.id} 
              onClick={() => handleSelectConv(c)}
              className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${activeConv?.id === c.id ? 'bg-muted' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="font-semibold text-sm truncate">Customer: {c.customer_id}</div>
                {c.is_human_takeover && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">PAUSED</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">{c.last_message}</div>
            </div>
          ))
        )}
      </div>

      {/* Main: Chat View */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        {activeConv ? (
          <>
            <div className="h-16 border-b flex items-center justify-between px-6 bg-card">
              <div className="font-semibold">Chat with {activeConv.customer_id}</div>
              <Button 
                variant={activeConv.is_human_takeover ? "default" : "destructive"}
                onClick={toggleTakeover}
              >
                {activeConv.is_human_takeover ? "Resume AI Bot" : "Pause AI (Human Takeover)"}
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm">No messages.</div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] rounded-xl p-3 text-sm ${
                      m.role === 'user' 
                        ? 'bg-muted text-foreground' 
                        : m.role === 'human_agent' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-primary text-primary-foreground'
                    }`}>
                      <div className="text-[10px] opacity-70 mb-1 uppercase font-bold tracking-wider">
                        {m.role === 'ai' ? 'Gemini AI' : m.role === 'human_agent' ? 'You (Manual)' : 'Customer'}
                      </div>
                      {m.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mock input box for human takeover mode */}
            {activeConv.is_human_takeover && (
              <div className="p-4 border-t bg-card flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type manual reply..."
                  className="flex-1 rounded-md border bg-transparent px-3 py-2 text-sm"
                />
                <Button>Send</Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to view chat history.
          </div>
        )}
      </div>
    </div>
  );
}
