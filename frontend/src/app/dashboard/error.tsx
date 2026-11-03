"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mx-auto">
          <AlertCircle size={28} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            An unexpected error occurred while loading this section of the cockpit. Our system has logged the event.
          </p>
        </div>

        {error?.message && (
          <div className="bg-slate-50 rounded-xl p-3 text-[11px] font-mono text-slate-600 text-left border border-slate-200/60 overflow-x-auto max-h-24">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B38A6] hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/10 active:scale-95 cursor-pointer"
          >
            <RefreshCw size={14} /> Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
          >
            <Home size={14} /> Back to Cockpit
          </Link>
        </div>
      </div>
    </div>
  );
}
