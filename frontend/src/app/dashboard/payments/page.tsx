"use client";

import { CheckCircle2, QrCode, ArrowUpRight, DollarSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockTransactions = [
  { id: "TX-1092", customer: "Vicheka_99", amount: "$15.00", method: "Bakong Pay", date: "Today, 10:45 AM", status: "completed" },
  { id: "TX-1091", customer: "Dara.K", amount: "$32.50", method: "Bakong Pay", date: "Today, 09:12 AM", status: "completed" },
  { id: "TX-1090", customer: "Srey_Moch", amount: "$12.00", method: "Bakong Pay", date: "Yesterday, 15:30 PM", status: "completed" },
];

export default function PaymentsPage() {
  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-ink mb-2">Payments & Billing</h1>
        <p className="text-brand-muted">Manage your Bakong integration and view AI-generated sales.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Bakong Integration Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-[#00938C] to-[#00706A] rounded-3xl p-8 text-white shadow-glow relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-10 -top-10 opacity-10">
            <QrCode className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full mb-6">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wider uppercase">Connected successfully</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-2">Bakong KHQR</h2>
            <p className="opacity-90 max-w-md mb-8">
              Your Bakong merchant account is linked. TokoAI will automatically generate unique QR codes for every customer and verify payments in real-time.
            </p>
          </div>
          
          <div className="relative z-10 flex gap-4">
            <Button className="bg-white text-[#00938C] hover:bg-white/90 rounded-xl font-bold">
              View Merchant Settings
            </Button>
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 rounded-xl">
              Disconnect
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-3xl p-8 border border-brand-line shadow-soft flex flex-col justify-center">
          <div className="w-12 h-12 bg-brand-mist rounded-xl flex items-center justify-center text-brand-ink mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-brand-muted font-medium mb-1">Today's AI Sales</h3>
          <div className="text-4xl font-extrabold text-brand-ink mb-2">$47.50</div>
          <div className="text-sm text-semantic-success flex items-center gap-1 font-bold">
            <ArrowUpRight className="w-4 h-4" /> +12% from yesterday
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-brand-line shadow-soft overflow-hidden">
        <div className="p-6 border-b border-brand-line flex justify-between items-center bg-brand-mist/50">
          <h3 className="font-bold text-brand-ink">Recent Transactions</h3>
          <Button variant="outline" size="sm" className="rounded-lg text-brand-muted text-xs">View All <ExternalLink className="w-3 h-3 ml-2"/></Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-brand-muted font-semibold text-xs uppercase border-b border-brand-line">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {mockTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-brand-mist/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-brand-ink">{tx.id}</td>
                  <td className="px-6 py-4 font-medium text-brand-ink">{tx.customer}</td>
                  <td className="px-6 py-4 font-bold text-brand-cyan-dark">{tx.amount}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#00938C]">
                      <div className="w-2 h-2 rounded-full bg-[#00938C]"></div> {tx.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-brand-muted">{tx.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-semantic-success/10 px-2.5 py-1 text-xs font-bold text-semantic-success">
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
