"use client";

import { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, FileText, Trash2, Bot, Plus, Sparkles, CheckCircle2, 
  Layers, HelpCircle, PlusCircle, Search, Edit3, X, ArrowRight, Package
} from "lucide-react";
import { Button, Input, Card, Badge, Modal } from "@/components/ui/design-system";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState<'products' | 'faqs'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Vision Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [draftProduct, setDraftProduct] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Product Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualNameKh, setManualNameKh] = useState("");
  const [manualPrice, setManualPrice] = useState("15.00");
  const [manualStock, setManualStock] = useState("25");
  const [manualCategory, setManualCategory] = useState("Clothing");
  const [manualSku, setManualSku] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualVariants, setManualVariants] = useState("S: 10, M: 25, L: 0, XL: 15");
  const [isSavingManual, setIsSavingManual] = useState(false);

  // FAQ Form state
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
      setProducts(res.data || []);
    } catch(e) { console.error(e); }
  };

  const fetchFaqs = async () => {
    try {
      const res = await api.get('/seller/faqs');
      setFaqs(res.data || []);
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

  // Manual Product Creation
  const handleCreateManualProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPrice) {
      toast.warning("Please provide product name and price");
      return;
    }
    setIsSavingManual(true);
    try {
      // Parse manualVariants e.g. "S: 10, M: 25, L: 0, XL: 15"
      const parsedVariants = manualVariants
        .split(',')
        .map(item => {
          const parts = item.split(':').map(s => s.trim());
          if (parts.length >= 2) {
            return { size: parts[0], stock: parseInt(parts[1], 10) || 0 };
          }
          return null;
        })
        .filter(Boolean);

      await api.post("/products", {
        name: manualName,
        name_kh: manualNameKh || undefined,
        category: manualCategory,
        price: parseFloat(manualPrice) || 0.0,
        stock: parseInt(manualStock, 10) || 0,
        sku: manualSku || undefined,
        description: manualDesc || "Authentic quality merchandise.",
        variants: parsedVariants
      });
      toast.success(`"${manualName}" added with size variants! AI embeddings synced.`);
      setIsAddModalOpen(false);
      // Reset form
      setManualName("");
      setManualNameKh("");
      setManualPrice("15.00");
      setManualStock("25");
      setManualSku("");
      setManualDesc("");
      setManualVariants("S: 10, M: 25, L: 0, XL: 15");
      fetchProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to create product");
    } finally {
      setIsSavingManual(false);
    }
  };

  // Inline Stock Adjustment (+1 or -1)
  const handleAdjustStock = async (product: any, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    try {
      await api.patch(`/products/${product.id}`, { stock: newStock });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
      toast.info(`Stock updated: ${product.name} (${newStock} units remaining)`);
    } catch (e) {
      toast.error("Failed to update stock");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.info(`"${productName}" removed from store catalog.`);
    } catch (e) {
      toast.error("Failed to delete product");
    }
  };

  // FAQs
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.name_kh && p.name_kh.includes(searchQuery)) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              Product Catalog &amp; Store Rules
            </h1>
            <Badge variant="brand" className="text-[10px]">768d pgvector</Badge>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Multimodal vision ingestion and Khmer conversational FAQ rules bounded strictly to your shop.
          </p>
        </div>

        {activeTab === 'products' && (
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary"
              className="h-9 text-xs gap-1.5 shadow-xs"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle size={14} className="text-[#1B38A6]" /> Add Manually
            </Button>
            <Button 
              variant="brand" 
              className="h-9 text-xs gap-1.5 shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={14} /> Upload Photo
            </Button>
          </div>
        )}
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setActiveTab('products')} 
            className={`text-xs font-bold pb-2 -mb-px border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'products' 
                ? 'border-[#1B38A6] text-[#0F172A]' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Layers size={14} /> Product Catalog ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('faqs')} 
            className={`text-xs font-bold pb-2 -mb-px border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'faqs' 
                ? 'border-[#1B38A6] text-[#0F172A]' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <HelpCircle size={14} /> Conversational Rules &amp; FAQs ({faqs.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <Input 
            placeholder={activeTab === 'products' ? "Search SKU or name..." : "Search QA rules..."}
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-xs bg-white border-slate-200 rounded-xl"
          />
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-6">
          
          {/* Multimodal Vision Intake Dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="p-6 md:p-7 bg-white border border-slate-200 hover:border-[#1B38A6]/80 transition-all rounded-3xl shadow-sm hover:shadow-md cursor-pointer group"
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              
              <div className="flex items-start gap-4">
                <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#1B38A6] shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  {isUploading ? (
                    <Bot size={24} className="animate-pulse" />
                  ) : (
                    <Sparkles size={24} />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base font-extrabold text-[#0F172A]">
                      {isUploading ? "Gemini Vision Scanning Product Photo..." : "Multimodal Vision Catalog Ingestion"}
                    </h3>
                    <span className="text-[10px] font-bold bg-teal-50 text-[#00938C] px-2 py-0.5 rounded-full border border-teal-200">
                      OCR + 768d Vector
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    Upload live stream screenshots or product photos. Vision AI automatically extracts product title, size options, and prices in USD or KHR, then indexes 768d vector embeddings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button className="h-9 px-4 rounded-xl bg-[#1B38A6] hover:bg-[#142C85] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 w-full md:w-auto shadow-sm">
                  <UploadCloud size={14} /> Upload Image
                </button>
              </div>

            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 space-y-2">
              <Package size={32} className="mx-auto text-slate-300" />
              <p className="font-bold text-sm text-[#0F172A]">No Products in Catalog</p>
              <p className="text-slate-400 max-w-sm mx-auto">
                Add your first product manually or upload a product photo to train your AI sales bot.
              </p>
              <div className="pt-2">
                <Button variant="brand" className="text-xs font-bold" onClick={() => setIsAddModalOpen(true)}>
                  Add First Product
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map(p => (
                <Card key={p.id} className="relative overflow-hidden group border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all rounded-2xl flex flex-col justify-between">
                  {p.stock === 0 && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-500 text-white shadow-xs">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="h-36 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100 relative">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={p.image_url.startsWith('http') ? p.image_url : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace('/api/v1', '')}${p.image_url}`} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <span className="text-3xl opacity-40">🛍️</span>
                      )}
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Product"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="p-3.5 space-y-1">
                      <p className="text-xs font-bold text-[#0F172A] truncate" title={p.name}>
                        {p.name_kh || p.name}
                      </p>
                      {p.sku && <p className="text-[10px] font-mono text-slate-400">{p.sku}</p>}
                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="text-xs font-black text-[#1B38A6] tabular-nums">${Number(p.price).toFixed(2)}</span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          (៛{Math.round(Number(p.price) * 4100).toLocaleString()})
                        </span>
                      </div>

                      {/* Product Variant Pills (Sizes / Colors & Real-Time Stock) */}
                      {p.variants && Array.isArray(p.variants) && p.variants.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {p.variants.map((v: any, idx: number) => {
                            const isOutOfStock = (v.stock ?? 0) <= 0;
                            const label = v.size ? (v.color ? `${v.size}/${v.color}` : v.size) : (v.color || `V${idx + 1}`);
                            return (
                              <span 
                                key={idx}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium border ${
                                  isOutOfStock 
                                    ? 'bg-rose-50 text-rose-500 border-rose-200 line-through' 
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                                title={`${label}: ${isOutOfStock ? 'Sold Out' : `${v.stock} in stock`}`}
                              >
                                {label}: {isOutOfStock ? '0' : v.stock}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Stock Quick-Controls */}
                  <div className="px-3.5 pb-3 pt-1 border-t border-[#F5F2ED] flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-500">
                      Stock: <span className="font-bold text-[#0F172A] tabular-nums">{p.stock}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleAdjustStock(p, -1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                        title="Reduce Stock"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => handleAdjustStock(p, 1)}
                        className="w-6 h-6 rounded-md bg-blue-50 hover:bg-blue-100 text-[#1B38A6] font-bold flex items-center justify-center transition-colors border border-blue-200/80"
                        title="Add Stock"
                      >
                        +
                      </button>
                    </div>
                  </div>

                </Card>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Manual Product Creation Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-xl animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Add Product to Catalog</h3>
                <p className="text-xs text-slate-500">Vector embeddings will be generated automatically for RAG.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateManualProduct} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Product Name (English) *</label>
                  <Input 
                    placeholder="e.g. Vintage Denim Jacket" 
                    value={manualName}
                    onChange={(e: any) => setManualName(e.target.value)}
                    required
                    className="text-xs bg-slate-50 border-slate-200 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Product Name (Khmer)</label>
                  <Input 
                    placeholder="e.g. អាវខូវប៊យម៉ូតចាស់" 
                    value={manualNameKh}
                    onChange={(e: any) => setManualNameKh(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200 h-9 font-khmer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Price (USD) *</label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="25.00" 
                    value={manualPrice}
                    onChange={(e: any) => setManualPrice(e.target.value)}
                    required
                    className="text-xs bg-slate-50 border-slate-200 h-9"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">
                    ≈ {(parseFloat(manualPrice || "0") * 4100).toLocaleString()} ៛
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Stock Units *</label>
                  <Input 
                    type="number"
                    placeholder="50" 
                    value={manualStock}
                    onChange={(e: any) => setManualStock(e.target.value)}
                    required
                    className="text-xs bg-slate-50 border-slate-200 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Category</label>
                  <Input 
                    placeholder="Clothing" 
                    value={manualCategory}
                    onChange={(e: any) => setManualCategory(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200 h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Custom SKU Code (Optional)</label>
                <Input 
                  placeholder="e.g. JKT-DENIM-01" 
                  value={manualSku}
                  onChange={(e: any) => setManualSku(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 h-9 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description / Highlights</label>
                <Input 
                  placeholder="Key details (fabric, sizing, available colors)" 
                  value={manualDesc}
                  onChange={(e: any) => setManualDesc(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 h-9"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Variants (Sizes &amp; Stock)</label>
                  <span className="text-[10px] text-slate-400">Format: Size: Stock (e.g. S: 10, M: 25)</span>
                </div>
                <Input 
                  placeholder="S: 10, M: 25, L: 0, XL: 15" 
                  value={manualVariants}
                  onChange={(e: any) => setManualVariants(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 h-9 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="brand" disabled={isSavingManual} className="text-xs font-bold">
                  {isSavingManual ? "Indexing Vector..." : "Add to Catalog"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vision AI Review Modal */}
      {draftProduct && (
        <Modal isOpen={!!draftProduct} onClose={() => setDraftProduct(null)} title="Vision AI Extracted Product Draft">
          <div className="space-y-4 text-xs">
            <div className="flex gap-4">
              {draftProduct.image_url && (
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draftProduct.image_url} alt="Draft preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-1 flex-1">
                <label className="font-bold text-slate-700">Product Title</label>
                <Input 
                  value={draftProduct.name} 
                  onChange={(e: any) => setDraftProduct({...draftProduct, name: e.target.value})} 
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Price (USD)</label>
                <Input 
                  type="number" 
                  value={draftProduct.price || 12.00} 
                  onChange={(e: any) => setDraftProduct({...draftProduct, price: parseFloat(e.target.value)})} 
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Initial Stock</label>
                <Input 
                  type="number" 
                  value={draftProduct.stock || 20} 
                  onChange={(e: any) => setDraftProduct({...draftProduct, stock: parseInt(e.target.value, 10)})} 
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Description</label>
              <Input 
                value={draftProduct.description || ""} 
                onChange={(e: any) => setDraftProduct({...draftProduct, description: e.target.value})} 
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setDraftProduct(null)}>Discard</Button>
              <Button variant="brand" onClick={handleSaveProduct}>Confirm &amp; Index</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Tab 2: Conversational Rules & FAQs */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          
          {/* Add Rule Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#0F172A]">Teach AI Store Specific Rules</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Custom policies for delivery, operating hours, warranties, or payment instructions injected directly into RAG context.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">When buyer asks (Question)...</label>
                <Input 
                  placeholder="e.g. តើមានសេវាដឹកទៅខេត្តកំពតទេ?" 
                  value={newQuestion}
                  onChange={(e: any) => setNewQuestion(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl font-khmer h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">AI should answer (Policy)...</label>
                <Input 
                  placeholder="e.g. ខាងអូនមានសេវាដឹកទៅកំពតតាម Virak Buntham ថ្លៃ $2.50 ចា៎" 
                  value={newAnswer}
                  onChange={(e: any) => setNewAnswer(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 rounded-xl font-khmer h-10"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="brand" onClick={handleAddFaq} className="text-xs font-bold gap-1.5 rounded-xl">
                <Plus size={14} /> Add Conversational Rule
              </Button>
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-2.5">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No custom store rules configured. Default Cambodian delivery and payment playbooks are active.
              </div>
            ) : (
              filteredFaqs.map(f => (
                <div key={f.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-start justify-between gap-4 shadow-xs hover:border-slate-300 transition-colors">
                  <div className="space-y-1 font-khmer">
                    <p className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                      <span className="text-[#1B38A6] font-mono font-black text-xs">Q:</span> {f.question}
                    </p>
                    <p className="text-xs text-slate-600 pl-4 leading-relaxed">
                      <span className="text-[#00938C] font-mono font-bold text-xs">A:</span> {f.answer}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteFaq(f.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors rounded-lg hover:bg-slate-50 shrink-0"
                    title="Delete rule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
