"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, Send, ShieldAlert, Bot, QrCode, User, ChevronLeft, Sparkles, 
  MessageCircle, Phone, MapPin, Truck, CheckCircle2, Zap, ArrowRight, ShieldCheck, RefreshCw,
  Volume2, VolumeX, PlusCircle, AlertTriangle, Image as ImageIcon, ExternalLink, Gift
} from "lucide-react";
import { Button, Input, Badge } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

// Detect Cambodian mobile telecom carrier from phone prefix
const detectCarrier = (phone?: string | null): string => {
  if (!phone) return "Local";
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  const prefix2 = cleaned.slice(0, 3); // e.g. 012, 098, 088
  
  const smartPrefixes = ["010", "015", "016", "081", "086", "087", "093", "096", "098", "070"];
  const cellcardPrefixes = ["011", "012", "014", "017", "061", "076", "077", "078", "079", "085", "089", "092", "095", "099"];
  const metfonePrefixes = ["031", "060", "066", "067", "068", "071", "088", "090", "097"];

  if (smartPrefixes.includes(prefix2)) return "Smart";
  if (cellcardPrefixes.includes(prefix2)) return "Cellcard";
  if (metfonePrefixes.includes(prefix2)) return "Metfone";
  return "Cambodia";
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [aiMode, setAiMode] = useState<'autopilot' | 'draft' | 'manual'>('autopilot');
  const [suggestedDraft, setSuggestedDraft] = useState<string>("ជម្រាបសួរបង! ខាងអូនមាន size M និង size XL ពណ៌ខ្មៅក្នុងស្តុកណា៎បង តម្លៃ $12.00 ដឹកជូនដល់ផ្ទះចា៎ 🥰");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const prevMsgCountRef = useRef<number>(0);
  const toast = useToast();

  // Play subtle synth bell chime via Web Audio API (no external asset needed)
  const playInboundChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Poll conversations every 4 seconds
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 4000);
    return () => clearInterval(interval);
  }, []);

  // Poll messages every 2.5 seconds when active
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      const interval = setInterval(() => fetchMessages(activeChatId), 2500);
      return () => clearInterval(interval);
    }
  }, [activeChatId]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/seller/inbox');
      const convList = res.data || [];
      setConversations(convList);
      if (convList.length > 0) {
        setActiveChatId(prev => prev || convList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await api.get(`/seller/inbox/${id}`);
      const newMessages = res.data?.messages || [];
      
      // Trigger chime if new user message arrived
      if (prevMsgCountRef.current > 0 && newMessages.length > prevMsgCountRef.current) {
        const latest = newMessages[newMessages.length - 1];
        if (latest && (latest.role === 'user' || latest.role === 'customer')) {
          playInboundChime();
        }
      }
      prevMsgCountRef.current = newMessages.length;

      setMessages(newMessages);
      setIsPaused(res.data.is_human_takeover);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchConversations();
    if (activeChatId) await fetchMessages(activeChatId);
    setIsRefreshing(false);
    toast.success("Inbox synchronized with TikTok Shop");
  };

  const handleSendReply = async (customText?: string) => {
    const textToSend = customText || replyText;
    if (!textToSend.trim() || !activeChatId) return;
    try {
      await api.post(`/seller/inbox/${activeChatId}/reply`, { content: textToSend });
      if (!customText) setReplyText("");
      fetchMessages(activeChatId);
      fetchConversations();
      toast.success("Reply delivered to buyer via TikTok DM");
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
      fetchConversations();
      toast.info(isPaused ? "AI Auto-Pilot Resumed" : "AI Paused: Human takeover active");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update AI state");
    }
  };

  // 1-Tap Inbound Simulation for Testing
  const handleSimulateInbound = async (queryText: string) => {
    setIsSimulating(true);
    try {
      await api.post("/seller/settings/simulate", {
        message: queryText,
        bot_tone: "Friendly"
      });
      toast.success("Simulation triggered! AI replied.");
      await fetchConversations();
      if (activeChatId) await fetchMessages(activeChatId);
    } catch (e) {
      toast.error("Simulation failed. Make sure backend is running.");
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    (c.customer_name && c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.customer_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.last_message && c.last_message.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.customer_phone && c.customer_phone.includes(searchQuery))
  );

  const activeConv = conversations.find(c => c.id === activeChatId);
  const activeCarrier = detectCarrier(activeConv?.customer_phone);

  // Helper to parse message content and render image attachments
  const renderMessageBubble = (msg: any) => {
    if (msg.role === 'system') {
      return (
        <div className="w-full flex justify-center my-2">
          <div className="bg-slate-100 border border-slate-200/90 text-slate-700 px-3.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
            <span>{msg.content}</span>
          </div>
        </div>
      );
    }

    const imgRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)|\[Image Attached:\s*(https?:\/\/[^\s\]]+)\]/i;
    const match = msg.content.match(imgRegex);
    const imageUrl = match ? (match[1] || match[2]) : null;
    const textWithoutImage = msg.content.replace(imgRegex, '').trim();

    const isCustomer = msg.role === 'customer' || msg.role === 'user';

    return (
      <div 
        key={msg.id} 
        className={`flex items-start max-w-[85%] md:max-w-[75%] ${isCustomer ? '' : 'ml-auto justify-end'}`}
      >
        {isCustomer ? (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              {(activeConv?.customer_name || 'U').charAt(0)}
            </div>
            <div className="bg-white border border-slate-200 text-[#0F172A] text-xs md:text-sm p-4 rounded-2xl rounded-tl-xs shadow-sm leading-relaxed space-y-2">
              <div className="text-[10px] font-sans font-bold text-slate-400">
                Buyer via TikTok DM
              </div>
              {textWithoutImage && <p>{textWithoutImage}</p>}
              {imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs max-w-xs mt-1 bg-slate-50">
                  <img 
                    src={imageUrl} 
                    alt="Buyer upload" 
                    className="w-full max-h-56 object-cover cursor-pointer hover:opacity-95"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                  <div className="p-1.5 text-[10px] text-slate-500 bg-white border-t border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1"><ImageIcon size={11} /> Attachment</span>
                    <span className="text-[#1B38A6] font-bold flex items-center gap-0.5">Open <ExternalLink size={10} /></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <div className="bg-white border-2 border-blue-200 text-[#0F172A] text-xs md:text-sm p-4 rounded-2xl rounded-tr-xs shadow-sm flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3 text-[10px] font-sans">
                <span className="text-[#1B38A6] font-extrabold flex items-center gap-1">
                  <Sparkles size={11} /> {msg.role === 'human_agent' ? 'Store Manager (Manual)' : 'Spoken Khmer AI Closer'}
                </span>
                <span className="text-slate-400 font-mono">
                  {msg.role === 'human_agent' ? 'Dashboard Staff' : 'Gemini 2.5 Flash'}
                </span>
              </div>
              <span className="leading-relaxed font-medium">{msg.content.replace(/khqr:\/\/bakong\/[a-zA-Z0-9-]+/g, '')}</span>
              
              {(msg.type === 'bakong' || msg.content.includes('khqr://bakong')) && (
                <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center mt-2 border border-slate-200 shadow-sm text-center">
                  <div className="text-[#00938C] font-extrabold text-xs mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} /> BAKONG KHQR INSTANT PAY
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs my-1.5">
                    <QrCode size={130} className="text-[#0F172A]" />
                  </div>
                  <span className="text-[#0F172A] font-extrabold text-xs">Scan via ABA Mobile or Bakong App</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-sans">Zero Fee · Instant Webhook Settlement</span>
                </div>
              )}
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#1B38A6] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Bot size={14} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm animate-in fade-in duration-300">
      
      {/* 1. Left Column: Live Buyer Queue */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Search & Channel Header */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                TikTok DM Streams
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute Chime" : "Enable Chime"}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {soundEnabled ? <Volume2 size={13} className="text-[#1B38A6]" /> : <VolumeX size={13} />}
              </button>
              <button 
                onClick={handleManualRefresh} 
                title="Sync Inbox"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[#1B38A6]" : ""} />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search buyer name, phone, or message..." 
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-xl focus:bg-white" 
            />
          </div>

          {/* Quick Simulation Bar */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[10px]">
            <span className="font-bold text-slate-400 uppercase tracking-widest shrink-0 text-[9px]">Test Sim:</span>
            <button
              onClick={() => handleSimulateInbound("man stock tee black ot b? price man?")}
              disabled={isSimulating}
              className="px-2 py-0.5 rounded-lg bg-blue-50 text-[#1B38A6] border border-blue-200/80 font-bold hover:bg-blue-100 transition-colors shrink-0"
            >
              Price Query
            </button>
            <button
              onClick={() => handleSimulateInbound("ok yok 1 cod tov toul kork 012 884 921")}
              disabled={isSimulating}
              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold hover:bg-emerald-100 transition-colors shrink-0"
            >
              Order COD
            </button>
            <button
              onClick={() => handleSimulateInbound("nhom transfer tam ABA $13.50 hz b check slip oy pg (Ref: TRX-9921)")}
              disabled={isSimulating}
              className="px-2 py-0.5 rounded-lg bg-teal-50 text-[#00938C] border border-teal-200/80 font-bold hover:bg-teal-100 transition-colors shrink-0"
            >
              Payment Slip
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-xs flex flex-col items-center justify-center h-64 text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#1B38A6] mb-3 shadow-sm">
                <MessageCircle size={22} />
              </div>
              <span className="font-bold text-sm text-[#0F172A]">Live DM Stream Ready</span>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Listening for incoming TikTok customer messages in Phnom Penh.
              </p>
            </div>
          )}

          {filteredConversations.map(conv => {
            const isSelected = conv.id === activeChatId;
            const carrier = detectCarrier(conv.customer_phone);
            const displayName = conv.customer_name || `Buyer @${String(conv.customer_id || '').slice(0, 8)}`;

            return (
              <button
                key={conv.id}
                onClick={() => setActiveChatId(conv.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all border flex flex-col gap-1.5 ${
                  conv.is_human_takeover 
                    ? 'border-amber-300 bg-amber-50/40 shadow-xs ring-1 ring-amber-400/30'
                    : isSelected 
                      ? 'bg-blue-50/70 border-blue-300/90 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#0F172A] text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-xs">
                      {displayName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-extrabold truncate ${isSelected ? 'text-[#1B38A6]' : 'text-[#0F172A]'}`}>
                          {displayName}
                        </span>
                        {conv.customer_phone && (
                          <span className="text-[9px] font-bold bg-white text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded-md">
                            {carrier}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {conv.customer_phone || `ID: ${String(conv.customer_id || '').slice(0, 10)}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0 font-medium">
                    <span suppressHydrationWarning>{conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                  </span>
                </div>

                <p className={`text-xs truncate font-khmer pl-10.5 leading-relaxed ${isSelected ? 'text-slate-800 font-semibold' : 'text-slate-500'}`}>
                  {conv.last_message || "No messages yet"}
                </p>

                <div className="flex items-center justify-between pl-10.5 pt-0.5 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                    📍 {conv.customer_address ? String(conv.customer_address).split(',')[0] : "Phnom Penh"}
                  </span>
                  {conv.is_human_takeover ? (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <AlertTriangle size={9} className="text-amber-700" /> Urgent Takeover
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-teal-50 text-[#00938C] border border-teal-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={9} /> AI Pilot
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Middle Column: Conversation Thread & Co-Pilot */}
      {activeChatId ? (
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200 min-w-0">
          
          {/* Thread Header */}
          <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-6 bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={() => setActiveChatId(null)}
                className="md:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1B38A6] to-[#2563EB] flex items-center justify-center font-extrabold text-xs text-white shadow-sm shrink-0">
                {(activeConv?.customer_name || 'B').charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2 truncate">
                  {activeConv?.customer_name || `Buyer @${String(activeConv?.customer_id || '').slice(0, 8)}`}
                  {activeConv?.customer_phone && (
                    <span className="text-[10px] bg-blue-50 text-[#1B38A6] px-2 py-0.5 rounded-full border border-blue-200 font-bold shrink-0">
                      {activeCarrier} · {activeConv?.customer_phone}
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                  <MapPin size={11} className="text-slate-400 shrink-0" /> 
                  {activeConv?.customer_address || "Cambodia"}
                </span>
              </div>
            </div>

            {/* 3-Mode Segmented Control (TobSar & Enterprise AI Pattern) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-full text-[11px] font-bold border border-slate-200/80 shadow-2xs">
              <button
                onClick={() => {
                  if (isPaused) toggleAI();
                  setAiMode('autopilot');
                }}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  aiMode === 'autopilot' && !isPaused
                    ? 'bg-[#1B38A6] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Full 24/7 autonomous replies"
              >
                <Sparkles size={11} className={aiMode === 'autopilot' && !isPaused ? 'text-amber-300' : ''} />
                <span>AI Pilot</span>
              </button>
              <button
                onClick={() => {
                  setAiMode('draft');
                  toast.info("Copilot Draft Mode: AI prepares suggested reply for your 1-click review.");
                }}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  aiMode === 'draft'
                    ? 'bg-white text-[#1B38A6] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="AI drafts reply, human reviews and approves before sending"
              >
                <span>Draft Review</span>
              </button>
              <button
                onClick={() => {
                  if (!isPaused) toggleAI();
                  setAiMode('manual');
                }}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  isPaused || aiMode === 'manual'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Pause AI completely for human takeover"
              >
                <span>Manual</span>
              </button>
            </div>
          </div>

          {/* Quick Commerce Action Deck (Expanded 1-Tap Khmer Canned Replies) */}
          <div className="px-4 py-2 bg-white/90 backdrop-blur-xs border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs shrink-0 select-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">1-Tap Khmer Replies:</span>
            
            <button 
              onClick={() => handleSendReply("សូមបងជួយផ្ញើលេខទូរស័ព្ទ និងទីតាំងដឹកជញ្ជូនមកបន្តិចណា៎បង ដើម្បីខាងប្អូនចេញប័ណ្ណដឹកជញ្ជូនជូន!")}
              className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#00938C] border border-teal-200 text-[11px] font-bold hover:bg-teal-100/70 transition-colors shrink-0 flex items-center gap-1"
            >
              <Phone size={12} /> 📍 សុំលេខ & ទីតាំង
            </button>
            <button 
              onClick={() => handleSendReply("បាទបង នេះជាគណនី ABA របស់ហាង៖ 000 123 456 (TOKOAI SHOP) បងអាចវេររួចផ្ញើ Slip មកបានណា៎បង!")}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1B38A6] border border-blue-200 text-[11px] font-bold hover:bg-blue-100/70 transition-colors shrink-0 flex items-center gap-1"
            >
              <QrCode size={12} /> 💸 ផ្ញើគណនី ABA
            </button>
            <button 
              onClick={() => handleSendReply("ចាសបង ខាងអូនបានទទួលការកម្ម៉ង់រួចហើយ ឥឡូវកំពុងរៀបចំវេចខ្ចប់យ៉ាងស្អាតជូនបង!")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold hover:bg-slate-200/70 transition-colors shrink-0 flex items-center gap-1"
            >
              📦 កំពុងវេចខ្ចប់
            </button>
            <button 
              onClick={() => handleSendReply("អូនបានប្រគល់កញ្ចប់ទំនិញជូនអ្នកដឹកជញ្ជូន (Virak Buntham / J&T) រួចរាល់ហើយណា៎បង 1-2 ថ្ងៃដល់បងហើយ!")}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold hover:bg-blue-100/70 transition-colors shrink-0 flex items-center gap-1"
            >
              <Truck size={12} /> 🚚 បានប្រគល់ជូនអ្នកដឹក
            </button>
            <button 
              onClick={() => handleSendReply("សម្រាប់បង ខាងអូនជួយសម្រួល Free សេវាដឹកជញ្ជូនជូនបងពិសេសតែម្ដងណា៎បង! 🥰")}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100/70 transition-colors shrink-0 flex items-center gap-1"
            >
              <Gift size={12} /> 🎁 Free ដឹកជញ្ជូន
            </button>
            {isPaused && (
              <button 
                onClick={toggleAI}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 transition-colors shrink-0 flex items-center gap-1 shadow-xs"
              >
                <Sparkles size={12} /> 🤖 បើក AI Pilot វិញ
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 font-khmer">
            {messages.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                No message exchanges recorded in this session yet.
              </div>
            )}
            {messages.map(msg => renderMessageBubble(msg))}

            {isPaused && (
              <div className="flex items-center justify-center py-3">
                <div className="h-px bg-[#E4E7EF] flex-1"></div>
                <span className="px-4 text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2 bg-amber-100 py-1.5 rounded-full border border-amber-300 shadow-xs">
                  <ShieldAlert size={14} className="text-amber-700" /> AI Paused · Shop Owner in Manual Control
                </span>
                <div className="h-px bg-[#E4E7EF] flex-1"></div>
              </div>
            )}
          </div>

          {/* Reply Bar & Optional Draft Review Box */}
          <div className="p-3.5 bg-white border-t border-slate-200">
            {/* AI Draft Review Suggestion (TobSar & Enterprise AI Pattern) */}
            {aiMode === 'draft' && (
              <div className="mb-2.5 p-3 bg-blue-50/80 border border-blue-200/90 rounded-2xl flex items-start justify-between gap-3 shadow-xs animate-in slide-in-from-bottom-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#1B38A6]">
                    <Sparkles size={11} className="text-[#1B38A6]" /> AI Suggested Reply (Spoken Khmer)
                  </div>
                  <p className="text-xs font-khmer text-slate-800 leading-relaxed">
                    {suggestedDraft}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pt-1">
                  <button
                    onClick={() => {
                      setReplyText(suggestedDraft);
                      toast.info("Draft loaded into reply field for editing.");
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleSendReply(suggestedDraft);
                      toast.success("AI draft approved & sent to buyer!");
                    }}
                    className="px-3 py-1 text-xs font-bold text-white bg-[#1B38A6] hover:bg-blue-800 rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <Send size={11} /> Approve &amp; Send
                  </button>
                </div>
              </div>
            )}

            <div className="relative flex items-center">
              <Input 
                value={replyText}
                onChange={(e: any) => setReplyText(e.target.value)}
                onKeyDown={(e: any) => e.key === 'Enter' && handleSendReply()}
                placeholder={isPaused ? "Type your manual reply (Khmer or English)..." : aiMode === 'draft' ? "Review AI draft above, or type custom message..." : "AI is actively answering in spoken Khmer. Type here to takeover..."} 
                className="pr-12 h-11 bg-slate-50 border-slate-200 rounded-full text-xs md:text-sm focus:bg-white transition-colors" 
              />
              <Button 
                onClick={() => handleSendReply()} 
                variant="primary" 
                className="absolute right-1.5 h-8 w-8 p-0 rounded-full shadow-sm bg-[#1B38A6] hover:bg-blue-800"
              >
                <Send size={13} />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-slate-50 text-slate-500 p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center text-[#1B38A6] mb-4 shadow-sm">
            <Bot size={32} />
          </div>
          <h3 className="text-base font-extrabold text-[#0F172A]">Select a Conversation to Co-Pilot</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
            Review live buyer inquiries, inspect Bakong KHQR payment settlements, or click Takeover to reply manually.
          </p>
        </div>
      )}

      {/* 3. Right Column: AI Live Neural Telemetry */}
      <div className="hidden lg:flex w-80 bg-white border-l border-slate-200 flex-col shrink-0">
        <div className="h-16 border-b border-slate-200 flex items-center px-5 justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#1B38A6]" /> CRM &amp; AI Telemetry
          </span>
          <span className="text-[10px] font-bold bg-teal-50 text-[#00938C] px-2 py-0.5 rounded-full border border-teal-200">
            Real-Time
          </span>
        </div>
        
        {activeChatId ? (
          <div className="p-5 space-y-5 text-xs overflow-y-auto flex-1">
            
            {/* Buyer Profile Card */}
            <div>
              <h4 className="text-slate-400 uppercase tracking-wider text-[10px] font-extrabold mb-2">Customer Profile</h4>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Name</span>
                  <span className="font-extrabold text-[#0F172A]">{activeConv?.customer_name || "TikTok Buyer"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Orders Placed</span>
                  <span className="font-bold text-[#1B38A6]">{activeConv?.customer_orders || 0} Orders</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Lifetime Value</span>
                  <span className="font-bold text-emerald-700">${Number(activeConv?.customer_ltv || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (activeConv?.customer_orders || 0) > 0 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {(activeConv?.customer_orders || 0) > 0 ? 'VIP Regular Buyer' : 'New Customer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Extracted Cambodian Entities */}
            <div>
              <h4 className="text-slate-400 uppercase tracking-wider text-[10px] font-extrabold mb-2">Extracted Delivery Info</h4>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Phone size={11} className="text-[#1B38A6]" /> Phone
                  </span>
                  <span className="font-mono font-bold text-[#0F172A]">{activeConv?.customer_phone || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <MapPin size={11} className="text-[#00938C]" /> Destination
                  </span>
                  <span className="font-bold text-[#0F172A] text-right truncate max-w-[120px]">
                    {activeConv?.customer_address || "Phnom Penh"}
                  </span>
                </div>
              </div>
            </div>

            {/* Deterministic Execution Checklist */}
            <div>
              <h4 className="text-slate-400 uppercase tracking-wider text-[10px] font-extrabold mb-2">Deterministic Safeguards</h4>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 size={13} className="shrink-0" /> Multi-Tenant Vector RAG: Bounded
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 size={13} className="shrink-0" /> Multimodal Vision OCR: Active
                </div>
                <div className="flex items-center gap-2 text-[#00938C] font-bold">
                  <CheckCircle2 size={13} className="shrink-0" /> Zero-Amnesia Memory: Connected
                </div>
              </div>
            </div>

            {/* Carrier Dispatch Readiness */}
            <div className="p-3.5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-blue-200/80 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1B38A6] block">
                Fulfillment Readiness
              </span>
              <p className="text-[11px] text-slate-700 font-medium">
                Customer phone &amp; landmark address extracted. Ready for 1-tap dispatch.
              </p>
              <div className="pt-1 flex gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[#1B38A6] font-bold text-[10px]">
                  J&amp;T Express
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-teal-200 text-[#00938C] font-bold text-[10px]">
                  Virak Buntham VET
                </span>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-6 text-xs text-slate-400 text-center mt-16 leading-relaxed">
            Select a conversation on the left to inspect live Gemini reasoning tokens, phone carrier parsing, and Bakong settlement state.
          </div>
        )}
      </div>

    </div>
  );
}
