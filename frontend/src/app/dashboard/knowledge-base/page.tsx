"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Trash2, Bot } from "lucide-react";
import { Button, Input, Card, Badge, Modal } from "@/components/ui/design-system";
import api from "@/lib/api";

export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [draftProduct, setDraftProduct] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

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
    } catch (e) {
      console.error(e);
      alert("Failed to extract product info.");
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
    } catch (e) {
      console.error(e);
      alert("Failed to save product.");
    }
  };

  const handleAddFaq = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    try {
      await api.post('/seller/faqs', { question: newQuestion, answer: newAnswer });
      setNewQuestion("");
      setNewAnswer("");
      fetchFaqs();
    } catch(e) { console.error(e); }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await api.delete(`/seller/faqs/${id}`);
      fetchFaqs();
    } catch(e) { console.error(e); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-[#222] pb-4">
        <div className="flex space-x-6">
          <button 
            onClick={() => setActiveTab('products')} 
            className={`text-sm font-medium pb-4 -mb-[17px] border-b-2 transition-colors ${activeTab === 'products' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            Products Database
          </button>
          <button 
            onClick={() => setActiveTab('faqs')} 
            className={`text-sm font-medium pb-4 -mb-[17px] border-b-2 transition-colors ${activeTab === 'faqs' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          >
            Custom Rules & FAQs
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-6">
          <Card 
            className="p-8 border-dashed border-[#333] hover:border-[#555] transition-colors flex flex-col items-center justify-center text-center cursor-pointer bg-black" 
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
            <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center mb-4">
              {isUploading ? <Bot size={20} className="text-amber-500 animate-pulse" /> : <UploadCloud size={20} className="text-zinc-400" />}
            </div>
            <h3 className="text-sm font-medium text-white">
              {isUploading ? "Gemini is scanning your image..." : "Drag & Drop Product Images"}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              AI will automatically extract name, price, and category.
            </p>
          </Card>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {products.map(p => (
              <Card key={p.id} className="relative overflow-hidden group">
                {p.stock === 0 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <Badge variant="destructive">Out of Stock</Badge>
                  </div>
                )}
                <div className="h-32 bg-[#111] flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`http://localhost:8000${p.image_url}`} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>
                <div className="p-3 border-t border-[#222]">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <div className="flex justify-between mt-1 items-center">
                    <p className="text-xs text-zinc-400 tabular-nums">${p.price}</p>
                    <p className="text-[10px] text-zinc-500 uppercase">Stock: {p.stock}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <Card className="p-4 bg-black">
            <h3 className="text-sm font-medium text-white mb-3">Add Custom AI Rule</h3>
            <div className="flex gap-2">
              <Input 
                value={newQuestion}
                onChange={(e: any) => setNewQuestion(e.target.value)}
                placeholder="Question / Rule Title" 
                className="flex-1" 
              />
              <Input 
                value={newAnswer}
                onChange={(e: any) => setNewAnswer(e.target.value)}
                placeholder="AI's Answer" 
                className="flex-2" 
              />
              <Button onClick={handleAddFaq}>Add Rule</Button>
            </div>
          </Card>
          <div className="space-y-2">
            {faqs.map(faq => (
              <div key={faq.id} className="flex items-center justify-between p-3 border border-[#222] rounded-lg bg-[#0A0A0A] group">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-zinc-300 font-medium">{faq.question}</p>
                  <p className="text-xs text-zinc-500 flex items-center gap-2"><FileText size={12} /> {faq.answer}</p>
                </div>
                <button onClick={() => handleDeleteFaq(faq.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={!!draftProduct} onClose={() => setDraftProduct(null)} title="AI Vision Draft Review">
        {draftProduct && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-amber-500 mb-4 bg-amber-500/10 p-2 rounded-md">
              <Bot size={14} /> AI extracted these details. Please review before saving.
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-500">Extracted Name</label>
              <Input 
                value={draftProduct.name || ""} 
                onChange={(e: any) => setDraftProduct({...draftProduct, name: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">Price (USD)</label>
                <Input 
                  type="number"
                  value={draftProduct.price || ""} 
                  onChange={(e: any) => setDraftProduct({...draftProduct, price: parseFloat(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-zinc-500">Initial Stock</label>
                <Input 
                  type="number"
                  value={draftProduct.stock || 10} 
                  onChange={(e: any) => setDraftProduct({...draftProduct, stock: parseInt(e.target.value)})} 
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4 mt-4 border-t border-[#222]">
              <Button variant="ghost" className="flex-1" onClick={() => setDraftProduct(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSaveProduct}>Save to Database</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
