import React from 'react';
import { X } from 'lucide-react';

// ─── Button ──────────────────────────────────────────────────────────────────
export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-full text-xs font-semibold ' +
    'transition-all duration-200 select-none active:scale-[0.97] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B38A6]/30 ' +
    'disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2';

  const variants: Record<string, string> = {
    // Royal Cobalt — the canonical Rubick primary CTA
    primary:     'bg-[#1B38A6] hover:bg-[#142C85] text-white shadow-xs font-semibold',
    brand:       'bg-[#1B38A6] hover:bg-[#142C85] text-white shadow-xs font-semibold',
    // Charcoal — used for high-weight secondary actions
    dark:        'bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs font-semibold',
    // Pale surface chip
    secondary:   'bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 shadow-xs font-medium',
    // Transparent ghost
    ghost:       'text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A] border border-transparent',
    // Destructive red
    destructive: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 font-medium',
    // Amber warning
    warning:     'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 font-semibold',
    // Bakong teal trust
    teal:        'bg-teal-50 text-[#00938C] hover:bg-teal-100 border border-teal-200/80 font-semibold',
    // Emerald success
    cyan:        'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 font-semibold',
    // White outline
    outline:     'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 shadow-xs',
    // Royal Cobalt outline
    'brand-outline': 'border border-[#1B38A6] bg-white text-[#1B38A6] hover:bg-blue-50 font-semibold',
  };

  return (
    <button className={`${base} ${variants[variant] ?? variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

// ─── Input ───────────────────────────────────────────────────────────────────
export const Input = ({ className = '', ...props }: any) => (
  <input
    className={
      'flex h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 text-xs text-[#0F172A] ' +
      'shadow-xs transition-all duration-200 placeholder:text-slate-400 ' +
      'focus-visible:outline-none focus-visible:border-[#1B38A6] focus-visible:ring-2 focus-visible:ring-[#1B38A6]/15 ' +
      'disabled:cursor-not-allowed disabled:opacity-50 ' +
      className
    }
    {...props}
  />
);

// ─── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = ({ className = '', ...props }: any) => (
  <textarea
    className={
      'flex min-h-[85px] w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] ' +
      'shadow-xs transition-all duration-200 placeholder:text-slate-400 resize-none ' +
      'focus-visible:outline-none focus-visible:border-[#1B38A6] focus-visible:ring-2 focus-visible:ring-[#1B38A6]/15 ' +
      'disabled:cursor-not-allowed disabled:opacity-50 ' +
      className
    }
    {...props}
  />
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', onClick }: any) => (
  <div
    onClick={onClick}
    className={
      'rounded-2xl border border-[#E2E8F0] bg-white text-[#0F172A] ' +
      'shadow-[0_1px_3px_0_rgba(15,23,42,0.04),0_1px_2px_-1px_rgba(15,23,42,0.02)] ' +
      'transition-all duration-200 ' +
      (onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-[0_4px_16px_-2px_rgba(15,23,42,0.08)]' : '') +
      ' ' + className
    }
  >
    {children}
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'neutral', className = '' }: any) => {
  const variants: Record<string, string> = {
    neutral:     'bg-slate-100 text-slate-700 border-slate-200/70',
    success:     'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    warning:     'bg-amber-50 text-amber-700 border-amber-200/70',
    destructive: 'bg-rose-50 text-rose-700 border-rose-200/70',
    brand:       'bg-blue-50 text-[#1B38A6] border-blue-200/70',
    cyan:        'bg-sky-50 text-sky-700 border-sky-200/70',
    bakong:      'bg-teal-50 text-[#00938C] border-teal-200/70',
    dark:        'bg-[#0F172A] text-white border-transparent',
  };
  return (
    <span
      className={
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold border ' +
        (variants[variant] ?? variants.neutral) + ' ' + className
      }
    >
      {children}
    </span>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_24px_60px_rgba(15,23,42,0.18)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-bold text-[#0F172A] tracking-tight">{title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-[#0F172A] p-1 rounded-lg hover:bg-slate-100 transition-colors"
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

// ─── Divider ──────────────────────────────────────────────────────────────────
export const Divider = ({ className = '' }: any) => (
  <div className={`h-px bg-[#E2E8F0] w-full ${className}`} />
);

// ─── Section Header ──────────────────────────────────────────────────────────
export const SectionLabel = ({ children, icon: Icon, className = '' }: any) => (
  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 ${className}`}>
    {Icon && <Icon size={13} className="text-[#1B38A6]" />}
    {children}
  </div>
);
