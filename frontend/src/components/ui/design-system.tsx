import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";
  const variants: any = {
    primary: "bg-white text-black hover:bg-zinc-200 shadow-sm",
    secondary: "bg-[#111] text-zinc-100 hover:bg-[#222] border border-[#333]",
    ghost: "hover:bg-[#111] hover:text-white text-zinc-400 border border-transparent",
    destructive: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
    warning: "bg-amber-500 text-black hover:bg-amber-600 shadow-sm"
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input = ({ className = '', ...props }: any) => (
  <input 
    className={`flex h-9 w-full rounded-md border border-[#333] bg-black px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} 
    {...props} 
  />
);

export const Textarea = ({ className = '', ...props }: any) => (
  <textarea 
    className={`flex min-h-[80px] w-full rounded-md border border-[#333] bg-black px-3 py-2 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none ${className}`} 
    {...props} 
  />
);

export const Card = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`rounded-xl border border-[#222] bg-[#0A0A0A] text-zinc-100 ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, variant = 'neutral', className = '' }: any) => {
  const variants: any = {
    neutral: "bg-[#111] text-zinc-300 border-[#333]",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    destructive: "bg-red-500/10 text-red-400 border-red-500/20"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#222] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[#222] flex justify-between items-center bg-black">
          <h3 className="text-lg font-medium text-white tracking-tight">{title}</h3>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
