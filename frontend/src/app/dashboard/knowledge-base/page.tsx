"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Trash2, Bot, Plus, Sparkles, CheckCircle2, Layers, HelpCircle } from "lucide-react";
import { Button, Input, Card, Badge, Modal } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<'products' | 'faqs'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [draftProduct, setDraftProduct] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
    fetchFaqs();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch(e) { console.error(e); }
  };

  const fetchFaqs = async () => {
    try {
      const res = await api.get('/seller/faqs');
      setFaqs(res.data);
    } catch(e) { console.error(e); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/products/extract-vision", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDraftProduct(res.data);
      toast.success("Gemini Vision extracted product metadata! Please review draft.");
    } catch (e) {
      console.error(e);
      toast.error("Vision AI extraction failed. Try a clearer product image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProduct = async () => {
    try {
      await api.post("/products", draftProduct);
      setDraftProduct(null);
      fetchProducts();
      toast.success(`"${draftProduct.name}" added to AI catalog! Embeddings synced.`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save product to database.");
    }
  };

  const handleAddFaq = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.warning("Please provide both rule question and answer");
      return;
    }
    try {
      await api.post('/seller/faqs', { question: newQuestion, answer: newAnswer });
      setNewQuestion("");
      setNewAnswer("");
      fetchFaqs();
      toast.success("Custom conversational rule learned by AI!");
    } catch(e) { 
      console.error(e);
      toast.error("Failed to save conversational rule.");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await api.delete(`/seller/faqs/${id}`);
      fetchFaqs();
      toast.info("Rule removed from AI Knowledge Base.");
    } catch(e) { 
      console.error(e); 
      toast.error("Failed to delete rule.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Product Catalog & Store Rules
            </h1>
            <Badge variant="brand" className="text-[10px]">768d pgvector</Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Multimodal vision ingestion and Khmer conversational FAQ rules bounded strictly to your shop.
          </p>
        </div>

        {activeTab === 'products' && (
          <Button 
            variant="brand" 
            className="h-9 text-xs gap-1.5 shadow-sm shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={14} /> Upload Product Image
          </Button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center space-x-6 border-b border-slate-200/80">
        <button 
          onClick={() => setActiveTab('products')} 
          className={`text-xs font-bold pb-3.5 -mb-px border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'products' 
              ? 'border-[#EA580C] text-[#0F172A]' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Layers size={14} /> Product Catalog ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('faqs')} 
          className={`text-xs font-bold pb-3.5 -mb-px border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'faqs' 
              ? 'border-[#EA580C] text-[#0F172A]' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <HelpCircle size={14} /> Conversational Rules & FAQs ({faqs.length})
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Multimodal Vision Intake Dock */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="p-6 md:p-8 bg-white border border-[#E4E7EF] hover:border-[#EA580C]/80 transition-all rounded-3xl shadow-sm hover:shadow-md cursor-pointer group"
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#EA580C] shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  {isUploading ? (
                    <Bot size={26} className="animate-pulse" />
                  ) : (
                    <Sparkles size={26} />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#0F172A]">
                      {isUploading ? "Gemini 2.5 Vision Scanning Live Stream Photo..." : "Multimodal Vision Catalog Ingestion"}
                    </h3>
                    <span className="text-[10px] font-bold bg-teal-50 text-[#00938C] px-2 py-0.5 rounded-full border border-teal-200">
                      OCR + 768d Vector
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    Upload TikTok live stream screenshots, product photos, or handwritten Khmer price tags. 
                    Vision AI automatically extracts product title, size options, and prices in USD or KHR, then indexes 768-dimensional vector embeddings bounded to your shop.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                <button className="h-10 px-5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 w-full md:w-auto shadow-sm">
                  <UploadCloud size={15} /> Select Product Image
                </button>
              </div>

            </div>

            {/* Supported Input Formats Strip */}
            <div className="mt-5 pt-4 border-t border-[#FAF9F5] flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
              <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Optimized For:</span>
              <span className="px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E4E7EF] text-slate-600 font-medium">
                TikTok Live Stream Frames
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E4E7EF] text-slate-600 font-medium">
                Handwritten Khmer Price Notes
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E4E7EF] text-slate-600 font-medium">
                Supplier WeChat / Telegram Photos
              </span>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {products.map(p => (
              <Card key={p.id} className="relative overflow-hidden group border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm transition-all rounded-2xl">
                {p.stock === 0 && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-10 flex items-center justify-center">
                    <Badge variant="destructive">Out of Stock</Badge>
                  </div>
                )}
                <div className="h-40 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={p.image_url.startsWith('http') ? p.image_url : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api/v1', '')}${p.image_url}`} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <span className="text-4xl opacity-50">🛍️</span>
                  )}
                </div>
                <div className="p-3.5 bg-white">
                  <p className="text-xs font-bold text-[#0F172A] truncate">{p.name_kh || p.name}</p>
                  {p.sku && <p className="text-[10px] font-mono text-slate-400 font-bold">{p.sku}</p>}
                  <div className="flex justify-between mt-2 items-end">
                    <div>
                      <p className="text-xs font-extrabold text-[#EA580C] tabular-nums">${Number(p.price).toFixed(2)}</p>
                      <span className="text-[9px] text-slate-400 font-mono block">៛{Math.round(Number(p.price) * 4100).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      Stock: {p.stock}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <Card className="p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#EA580C]" /> Teach AI New Shop Policy
            </h3>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Input 
                value={newQuestion}
                onChange={(e: any) => setNewQuestion(e.target.value)}
                placeholder="Buyer question (e.g. ផ្ញើតាមណា? or Delivery speed)" 
                className="flex-1 text-xs" 
              />
              <Input 
                value={newAnswer}
                onChange={(e: any) => setNewAnswer(e.target.value)}
                placeholder="Spoken Khmer response (e.g. ផ្ញើតាម J&T 1 ថ្ងៃដល់)" 
                className="flex-1 text-xs font-khmer" 
              />
              <Button onClick={handleAddFaq} variant="brand" className="text-xs h-10 px-4 shrink-0 shadow-sm">
                <Plus size={14} className="mr-1" /> Add Rule
              </Button>
            </div>
          </Card>

          <div className="space-y-2.5">
            {faqs.map(faq => (
              <div 
                key={faq.id} 
                className="flex items-center justify-between p-4 border border-slate-200/80 rounded-2xl bg-white hover:border-slate-300 shadow-sm transition-all group"
              >
                <div className="flex flex-col gap-1 min-w-0 pr-4">
                  <p className="text-xs font-bold text-[#0F172A]">{faq.question}</p>
                  <p className="text-xs text-slate-600 font-khmer flex items-center gap-2">
                    <FileText size={12} className="text-[#EA580C] shrink-0" /> {faq.answer}
                  </p>
                </div>
                <button 
                  onClick={() => handleDeleteFaq(faq.id)} 
                  title="Delete Rule"
                  className="text-rose-600/70 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-all opacity-80 group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vision Draft Review Modal */}
      <Modal isOpen={!!draftProduct} onClose={() => setDraftProduct(null)} title="AI Vision Draft Review">
        {draftProduct && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-2xl">
              <Bot size={15} className="shrink-0 text-amber-700" /> Gemini extracted these product details. Adjust if needed before saving.
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Product Name</label>
              <Input 
                value={draftProduct.name || ""} 
                onChange={(e: any) => setDraftProduct({...draftProduct, name: e.target.value})} 
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Price (USD)</label>
                <Input 
                  type="number"
                  value={draftProduct.price || ""} 
                  onChange={(e: any) => setDraftProduct({...draftProduct, price: parseFloat(e.target.value)})} 
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Stock Count</label>
                <Input 
                  type="number"
                  value={draftProduct.stock || 10} 
                  onChange={(e: any) => setDraftProduct({...draftProduct, stock: parseInt(e.target.value)})} 
                  className="text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2.5 pt-3 mt-4 border-t border-slate-100">
              <Button variant="ghost" className="flex-1 text-xs" onClick={() => setDraftProduct(null)}>Discard</Button>
              <Button variant="brand" className="flex-1 text-xs shadow-sm" onClick={handleSaveProduct}>Save to Catalog</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
