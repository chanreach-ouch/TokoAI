"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function KnowledgeBasePage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const fetchFaqs = async () => {
    try {
      const res = await api.get("/seller/faqs");
      setFaqs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleAddFaq = async () => {
    if (!question || !answer) return;
    try {
      await api.post("/seller/faqs", { question, answer });
      setQuestion("");
      setAnswer("");
      fetchFaqs();
    } catch (err) {
      alert("Failed to add FAQ");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await api.delete(`/seller/faqs/${id}`);
      fetchFaqs();
    } catch (err) {
      alert("Failed to delete FAQ");
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
      <p className="text-muted-foreground mb-8">
        Train your AI by providing custom Frequently Asked Questions (FAQs). The AI will use these rules when talking to customers.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Add new FAQ */}
        <div className="rounded-xl border bg-card p-6 shadow-sm h-fit">
          <h3 className="text-lg font-semibold mb-4">Add Custom Rule / FAQ</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">If customer asks about:</label>
              <input 
                type="text"
                placeholder="e.g. Do you ship to Siem Reap?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">AI should answer:</label>
              <textarea 
                placeholder="e.g. Yes, delivery to Siem Reap takes 2 days and costs $2."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm min-h-[100px]"
              />
            </div>
            <Button onClick={handleAddFaq} className="w-full">Add to Knowledge Base</Button>
          </div>
        </div>

        {/* List existing FAQs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Trained Rules ({faqs.length})</h3>
          {faqs.length === 0 ? (
            <div className="text-sm text-muted-foreground italic border p-4 rounded-md">No custom rules added yet.</div>
          ) : (
            faqs.map(faq => (
              <div key={faq.id} className="rounded-xl border bg-card p-4 shadow-sm relative group">
                <div className="font-medium text-sm text-primary mb-1">Q: {faq.question}</div>
                <div className="text-sm text-muted-foreground">A: {faq.answer}</div>
                <button 
                  onClick={() => handleDeleteFaq(faq.id)}
                  className="absolute top-2 right-2 text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
