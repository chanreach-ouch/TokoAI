"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, Send, ShieldAlert, Bot, QrCode, User, ChevronLeft, Sparkles, 
  MessageCircle, Phone, MapPin, Truck, CheckCircle2, Zap, ArrowRight, ShieldCheck, RefreshCw,
  Volume2, VolumeX, PlusCircle, AlertTriangle, Image as ImageIcon, ExternalLink, Gift,
  Mic, Play, Pause, Crown, Tag, Package
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
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const prevMsgCountRef = useRef<number>(0);
  const toast = useToast();

  const playInboundChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 4000);
    return () => clearInterval(interval);
  }, []);

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
      
      if (prevMsgCountRef.current > 0 && newMessages.length > prevMsgCountRef.current) {
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg?.role === 'user' || lastMsg?.role === 'customer') {
          playInboundChime();
        }
      }
      prevMsgCountRef.current = newMessages.length;

      setMessages(newMessages);
      setIsPaused(res.data?.is_human_takeover ?? false);

      // Extract draft if AI mode is draft
      const lastUser = [...newMessages].reverse().find((m: any) => m.role === 'user');
      if (lastUser && lastUser.content.includes("chos")) {
        setSuggestedDraft("ចា៎បង! បើបងយក ២ ឡើងទៅ ខាងអូនជួយ Free Delivery ក្នុងភ្នំពេញជូនបងភ្លាមៗណា៎បង 🥰");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAI = async () => {
    if (!activeChatId) return;
    try {
      const res = await api.post(`/seller/inbox/${activeChatId}/takeover`);
      const newStatus = res.data?.is_human_takeover ?? !isPaused;
      setIsPaused(newStatus);
      if (newStatus) {
        setAiMode('manual');
        toast.info("Human Takeover active: AI autonomous replies paused.");
      } else {
        setAiMode('autopilot');
        toast.success("AI Autopilot resumed: Listening and closing sales.");
      }
      fetchConversations();
    } catch (e) {
      console.error(e);
      toast.error("Failed to toggle AI mode.");
    }
  };

  const handleSendReply = async (customText?: string) => {
    const text = customText || replyText;
    if (!text.trim() || !activeChatId) return;

    try {
      await api.post(`/seller/inbox/${activeChatId}/reply`, { content: text });
      setReplyText("");
      setIsPaused(true);
      setAiMode('manual');
      toast.success("Message sent to TikTok DM.");
      fetchMessages(activeChatId);
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message.");
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchConversations();
    if (activeChatId) await fetchMessages(activeChatId);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSimulateInbound = async (sampleText: string) => {
    if (!activeChatId || isSimulating) return;
    setIsSimulating(true);
    const conv = conversations.find(c => c.id === activeChatId);
    const senderId = conv?.customer_id || "sim-customer-1";

    try {
      toast.info("Simulating TikTok webhook inbound...");
      await api.post('/webhooks/tiktok/', {
        message_id: `sim_${Date.now()}`,
        sender_id: senderId,
        recipient_id: "mock_page_id",
        text: sampleText
      });
      playInboundChime();
      setTimeout(async () => {
        await fetchMessages(activeChatId);
        await fetchConversations();
        setIsSimulating(false);
      }, 1500);
    } catch (e) {
      setIsSimulating(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeChatId);
  const activeCarrier = detectCarrier(activeConv?.customer_phone);

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.customer_name || '').toLowerCase().includes(q) ||
      (c.customer_phone || '').includes(q) ||
      (c.last_message || '').toLowerCase().includes(q)
    );
  });

  // Render message bubble with audio support
  const renderMessageContent = (msg: any) => {
    const isCustomer = msg.role === 'customer' || msg.role === 'user';
    const isAudio = msg.media_type === 'audio' || msg.content?.startsWith("🎤 [Voice Note]:");

    const imgRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)|\[Image Attached:\s*(https?:\/\/[^\s\]]+)\]/i;
    const match = msg.content.match(imgRegex);
    const imageUrl = match ? (match[1] || match[2]) : null;
    const textWithoutImage = msg.content.replace(imgRegex, '').trim();

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
              <div className="text-[10px] font-sans font-bold text-slate-400 flex items-center justify-between">
                <span>Buyer via TikTok DM</span>
                {isAudio && (
                  <span className="flex items-center gap-1 text-[#1B38A6] font-bold">
                    <Mic size={11} /> Voice Note
                  </span>
                )}
              </div>

              {/* Khmer Voice Note Audio Card */}
              {isAudio && (
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/90 space-y-1.5 my-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)}
                        className="w-7 h-7 rounded-full bg-[#1B38A6] text-white flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        {playingAudioId === msg.id ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                      </button>
                      <span className="text-[11px] font-bold text-slate-800">
                        Voice Note {msg.audio_duration_sec ? `(${msg.audio_duration_sec.toFixed(0)}s)` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] bg-white border border-blue-200 text-[#1B38A6] px-2 py-0.5 rounded-full font-bold">
                      STT Transcribed
                    </span>
                  </div>

                  {/* Audio Waveform visualization */}
                  <div className="flex items-center gap-1 h-4 px-1">
                    {[4, 12, 8, 16, 10, 6, 14, 11, 7, 13, 9, 15, 6, 12, 8, 14].map((h, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full ${playingAudioId === msg.id ? 'bg-[#1B38A6] animate-pulse' : 'bg-slate-300'}`}
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>

                  {msg.media_url && playingAudioId === msg.id && (
                    <audio src={msg.media_url} autoPlay onEnded={() => setPlayingAudioId(null)} className="hidden" />
                  )}
                </div>
              )}

              {textWithoutImage && <p className="font-khmer">{textWithoutImage}</p>}
              
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
              <span className="leading-relaxed font-medium font-khmer">{msg.content.replace(/khqr:\/\/bakong\/[a-zA-Z0-9-]+/g, '')}</span>
              
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
      
      {/* 1. Left Column: Live Buyer Queue with Escalation & Bargaining Badges */}
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
              onClick={() => handleSimulateInbound("chos ban 15$ ot b? Nhom yok 2")}
              disabled={isSimulating}
              className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 font-bold hover:bg-amber-100 transition-colors shrink-0"
            >
              Bargain $15
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
            const isWholesale = conv.takeover_reason === "WHOLESALE_LEAD";
            const isComplaint = conv.takeover_reason === "CUSTOMER_COMPLAINT";

            return (
              <button
                key={conv.id}
                onClick={() => setActiveChatId(conv.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all border flex flex-col gap-1.5 ${
                  conv.is_human_takeover 
                    ? isComplaint ? 'border-rose-300 bg-rose-50/40 shadow-xs ring-1 ring-rose-400/30' : 'border-amber-300 bg-amber-50/40 shadow-xs ring-1 ring-amber-400/30'
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
                        {conv.buyer_tier === "VIP" && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                            <Crown size={8} /> VIP
                          </span>
                        )}
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
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    📍 {conv.customer_address ? String(conv.customer_address).split(',')[0] : "Phnom Penh"}
                  </span>

                  <div className="flex items-center gap-1">
                    {conv.last_bargain_at && (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                        Bargaining
                      </span>
                    )}

                    {conv.is_human_takeover ? (
                      isWholesale ? (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Package size={9} /> Wholesale Lead
                        </span>
                      ) : isComplaint ? (
                        <span className="text-[9px] font-bold bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <AlertTriangle size={9} /> Complaint
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          Takeover
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] font-bold bg-teal-50 text-[#00938C] border border-teal-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={9} /> AI Pilot
                      </span>
                    )}
                  </div>
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
                  {activeConv?.buyer_tier === "VIP" && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                      <Crown size={9} /> VIP Regular
                    </span>
                  )}
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

            {/* 3-Mode Segmented Control */}
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
                title="AI prepares draft for 1-click review"
              >
                <span>Draft Co-Pilot</span>
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
                title="Human Staff Takeover"
              >
                <span>Takeover</span>
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map(renderMessageContent)}

            {isPaused && (
              <div className="flex items-center justify-center py-3">
                <div className="h-px bg-[#E4E7EF] flex-1"></div>
                <span className="px-4 text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2 bg-amber-100 py-1.5 rounded-full border border-amber-300 shadow-xs">
                  <ShieldAlert size={14} className="text-amber-700" /> AI Paused · Shop Owner in Manual Control
                  {activeConv?.takeover_reason && ` (${activeConv.takeover_reason})`}
                </span>
                <div className="h-px bg-[#E4E7EF] flex-1"></div>
              </div>
            )}
          </div>

          {/* Reply Bar & Optional Draft Review Box */}
          <div className="p-3.5 bg-white border-t border-slate-200">
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

      {/* 3. Right Column: CRM & Buyer Memory Telemetry */}
      <div className="hidden lg:flex w-80 bg-white border-l border-slate-200 flex-col shrink-0">
        <div className="h-16 border-b border-slate-200 flex items-center px-5 justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#1B38A6]" /> Long-Term Buyer Memory
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
                  <span className="text-slate-500 font-medium">Buyer Tier</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeConv?.buyer_tier === 'VIP' 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : activeConv?.buyer_tier === 'RETURNING'
                        ? 'bg-blue-100 text-[#1B38A6] border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                  }`}>
                    {activeConv?.buyer_tier || "NEW"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Orders Placed</span>
                  <span className="font-bold text-[#1B38A6]">{activeConv?.customer_orders || 0} Orders</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Lifetime Value</span>
                  <span className="font-bold text-emerald-700">${Number(activeConv?.customer_ltv || 0).toFixed(2)}</span>
                </div>
                {activeConv?.communication_style_notes && (
                  <div className="pt-1 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-0.5">Communication Habits:</span>
                    {activeConv.communication_style_notes}
                  </div>
                )}
              </div>
            </div>

            {/* Cultural Bargaining Tracker */}
            {activeConv?.last_bargain_at && (
              <div>
                <h4 className="text-slate-400 uppercase tracking-wider text-[10px] font-extrabold mb-2">Bargaining Telemetry</h4>
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800 font-bold">Negotiated Price:</span>
                    <span className="font-black text-emerald-700 text-sm">
                      ${activeConv.bargain_offered_price ? Number(activeConv.bargain_offered_price).toFixed(2) : '15.00'}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700">
                    Win-back cron scheduled if buyer stops responding for &gt;45 mins.
                  </p>
                </div>
              </div>
            )}

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

            {/* Fulfillment Readiness */}
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
