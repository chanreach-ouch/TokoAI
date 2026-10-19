import React from 'react';
import { X } from 'lucide-react';

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 select-none active:scale-[0.98]";
  
  const variants: any = {
    primary: "bg-[#0F172A] hover:bg-black text-white shadow-xs font-semibold",
    brand: "bg-[#EA580C] hover:bg-[#D97706] text-white shadow-xs font-semibold",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/60 shadow-2xs font-medium",
    ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600 border border-transparent",
    destructive: "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 font-medium",
    warning: "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 font-semibold",
    cyan: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 font-semibold",
    outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
  };

  return (
    <button className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ className = '', ...props }: any) => (
  <input 
    className={`flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 shadow-2xs transition-all duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-[#EA580C] focus-visible:ring-2 focus-visible:ring-[#EA580C]/15 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} 
    {...props} 
  />
);

export const Textarea = ({ className = '', ...props }: any) => (
  <textarea 
    className={`flex min-h-[85px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-2xs transition-all duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-[#EA580C] focus-visible:ring-2 focus-visible:ring-[#EA580C]/15 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${className}`} 
    {...props} 
  />
);

export const Card = ({ children, className = '', onClick }: any) => (
  <div 
    onClick={onClick} 
    className={`rounded-2xl border border-slate-200/80 bg-white text-[#0F172A] shadow-xs transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Badge = ({ children, variant = 'neutral', className = '' }: any) => {
  const variants: any = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200/70",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    warning: "bg-amber-50 text-amber-700 border-amber-200/70",
    destructive: "bg-rose-50 text-rose-700 border-rose-200/70",
    brand: "bg-orange-50 text-[#EA580C] border-orange-200/70",
    cyan: "bg-sky-50 text-sky-700 border-sky-200/70",
    bakong: "bg-teal-50 text-[#00938C] border-teal-200/70"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold border ${variants[variant] || variants.neutral} ${className}`}>
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.12)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FAF9F5]">
          <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">{title}</h3>
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
