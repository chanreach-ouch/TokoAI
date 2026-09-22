"use client";

import { Button, Card, Badge } from "@/components/ui/design-system";

const MOCK_ORDERS = [
  { id: 'ORD-001', date: '2026-09-22', customer: 'Chanda M.', khr: '60,000', usd: '$15.00', status: 'Success' },
  { id: 'ORD-002', date: '2026-09-22', customer: 'Bopha K.', khr: '180,000', usd: '$45.00', status: 'Success' },
  { id: 'ORD-003', date: '2026-09-21', customer: 'Sokha V.', khr: '45,000', usd: '$11.25', status: 'Pending' },
];

export default function OrdersPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Bakong Orders</h2>
        <Button variant="secondary" className="h-8">Export Data</Button>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#050505] border-b border-[#222] text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Amount (KHR)</th>
              <th className="px-6 py-4 font-medium">Amount (USD)</th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {MOCK_ORDERS.map(order => (
              <tr key={order.id} className="hover:bg-[#111] transition-colors">
                <td className="px-6 py-4 font-medium text-white">{order.id}</td>
                <td className="px-6 py-4 text-zinc-400 tabular-nums">{order.date}</td>
                <td className="px-6 py-4 text-zinc-300">{order.customer}</td>
                <td className="px-6 py-4 text-zinc-300 tabular-nums">{order.khr}</td>
                <td className="px-6 py-4 text-zinc-300 tabular-nums">{order.usd}</td>
                <td className="px-6 py-4">
                  <Badge variant={order.status === 'Success' ? 'success' : 'warning'}>{order.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
