"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, "success"), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, "error"), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, "info"), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, "warning"), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        aria-live="polite" 
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 md:px-0"
      >
        {toasts.map((toast) => {
          let icon = <Info className="w-4 h-4 text-brand-cyan shrink-0" />;
          let borderClass = "border-brand-cyan/30 shadow-[0_4px_20px_rgba(20,241,217,0.15)]";
          
          if (toast.type === "success") {
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
            borderClass = "border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.15)]";
          } else if (toast.type === "error") {
            icon = <AlertCircle className="w-4 h-4 text-brand-pink shrink-0" />;
            borderClass = "border-brand-pink/30 shadow-[0_4px_20px_rgba(255,59,107,0.2)]";
          } else if (toast.type === "warning") {
            icon = <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
            borderClass = "border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.15)]";
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-ink-2/95 backdrop-blur-md border text-sm text-zinc-100 transition-all duration-300 animate-in slide-in-from-top-2 fade-in ${borderClass}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {icon}
                <span className="font-medium text-xs leading-relaxed truncate">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-lg"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
