'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getAllOrders } from '@/services/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCents } from '@/utils/currency';
import { formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '@/utils/helpers';
import { ORDER_STATUS_LABELS_IT, PAYMENT_STATUS_LABELS_IT } from '@/types';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

export default function AdminOrdiniPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const result = await getAllOrders(supabase, {
    status: statusFilter || undefined,
    paymentStatus: paymentFilter || undefined,
    search: search || undefined,
    orderType: typeFilter || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
      });
      setOrders(result.orders);
      setTotal(result.total);
      setIsLoading(false);
    };
    load();
  }, [supabase, search, statusFilter, paymentFilter, typeFilter, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ordini</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cerca per numero ordine..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <select
          className="h-10 px-3 rounded-md border bg-white text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ''); setPage(0); }}
        >
          <option value="">Tutti gli stati</option>
          {Object.entries(ORDER_STATUS_LABELS_IT).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="h-10 px-3 rounded-md border bg-white text-sm"
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value as PaymentStatus | ''); setPage(0); }}
        >
          <option value="">Tutti i pagamenti</option>
          {Object.entries(PAYMENT_STATUS_LABELS_IT).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="h-10 px-3 rounded-md border bg-white text-sm"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
        >
          <option value="">Tutti i tipi</option>
          <option value="online_payment">Pagamento online</option>
          <option value="in_store_payment">Prenotazione</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">#</th>
                <th className="text-left p-3 font-medium">Cliente</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Stato ordine</th>
                <th className="text-left p-3 font-medium">Pagamento</th>
                <th className="text-right p-3 font-medium">Totale</th>
                <th className="text-left p-3 font-medium">Data</th>
                <th className="text-center p-3 font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="p-3"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">Nessun ordine trovato</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const userInfo = order as unknown as { user?: { first_name?: string; last_name?: string; email?: string; username?: string } };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-medium">#{order.order_number}</td>
                      <td className="p-3">
                        <div>
                          <span className="font-medium">{userInfo.user?.first_name} {userInfo.user?.last_name}</span>
                          <br />
                          <span className="text-xs text-gray-500">{userInfo.user?.email}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${order.order_type === 'in_store_payment' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {order.order_type === 'in_store_payment' ? 'Prenotazione' : 'Online'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOrderStatusColor(order.order_status)}`}>
                          {ORDER_STATUS_LABELS_IT[order.order_status]}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                          {PAYMENT_STATUS_LABELS_IT[order.payment_status]}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">{formatCents(order.grand_total_cent)}</td>
                      <td className="p-3 text-xs text-gray-500">{formatDateTime(order.created_at)}</td>
                      <td className="p-3 text-center">
                        <Link
                          href={`/admin/ordini/${order.id}`}
                          className="px-3 py-1 text-xs rounded bg-gray-900 text-white hover:bg-gray-800"
                        >
                          Dettaglio
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t bg-gray-50">
            <span className="text-xs text-gray-500">{total} ordini totali</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <span className="text-sm">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
