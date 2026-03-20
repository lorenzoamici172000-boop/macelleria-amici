'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getOrderById, updateOrderStatus } from '@/services/orders';
import { Button } from '@/components/ui/button';
import { formatCents } from '@/utils/currency';
import { formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '@/utils/helpers';
import { ORDER_STATUS_LABELS_IT, PAYMENT_STATUS_LABELS_IT, ORDER_STATUS_TRANSITIONS } from '@/types';
import { ArrowLeft, AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [refundingItemId, setRefundingItemId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; payload?: unknown } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!params.id) return;
      const data = await getOrderById(supabase, params.id as string);
      setOrder(data);
      setIsLoading(false);
    };
    load();
  }, [params.id, supabase]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setConfirmAction(null);
    setIsUpdating(true);
    setError('');
    setSuccess('');

    const result = await updateOrderStatus(supabase, order.id, newStatus, ORDER_STATUS_TRANSITIONS);
    if (result.success) {
      setSuccess(`Stato aggiornato a: ${ORDER_STATUS_LABELS_IT[newStatus]}`);
      // Refresh order
      const updated = await getOrderById(supabase, order.id);
      setOrder(updated);
    } else {
      setError(result.error || 'Errore nell\'aggiornamento');
    }
    setIsUpdating(false);
  };

  const handleRefund = async (orderItemId: string) => {
    if (!order) return;
    setConfirmAction(null);
    setRefundingItemId(orderItemId);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderItemId, orderId: order.id }),
      });
      const result = await res.json();
      if (result.success) {
    setSuccess('Rimborso eseguito correttamente');
    const updated = await getOrderById(supabase, order.id);
    setOrder(updated);
      } else {
    setError(result.error || 'Errore nel rimborso');
      }
    } catch {
      setError('Errore di rete');
    }
    setRefundingItemId(null);
  };

  const handleGeneratePdf = () => {
    window.open(`/api/admin/pdf?orderId=${order?.id}`, '_blank');
  };

  if (isLoading) {
    return (
  
  
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Ordine non trovato</p>
      </div>
    );
  }

  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.order_status] || [];

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/ordini" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Torna agli ordini
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordine #{order.order_number}</h1>
          <p className="text-sm text-gray-500 mt-1">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {order.invoice_requested && (
            <Button variant="outline" size="sm" onClick={handleGeneratePdf}>
              <FileText size={16} className="mr-1" /> PDF Riepilogativo
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Status & Actions */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.order_status)}`}>
            {ORDER_STATUS_LABELS_IT[order.order_status]}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
            {PAYMENT_STATUS_LABELS_IT[order.payment_status]}
          </span>
          {order.order_type === 'in_store_payment' && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">Prenotazione</span>
          )}
          {order.invoice_requested && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">Richiesta fattura</span>
          )}
        </div>

        {/* Status transitions */}
        {allowedTransitions.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Cambia stato ordine:</p>
            <div className="flex flex-wrap gap-2">
              {allowedTransitions.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  isLoading={isUpdating}
                  onClick={() => setConfirmAction({ type: 'status', payload: status })}
                >
                  → {ORDER_STATUS_LABELS_IT[status]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Prodotti</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Prodotto</th>
              <th className="text-center p-3">Qtà</th>
              <th className="text-right p-3">Prezzo</th>
              <th className="text-right p-3">IVA</th>
              <th className="text-right p-3">Totale</th>
              <th className="text-center p-3">Stato</th>
              <th className="text-center p-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items?.map((item) => (
              <tr key={item.id} className={item.row_status === 'refunded' ? 'bg-red-50/50' : ''}>
                <td className="p-3 font-medium">{item.product_name_snapshot}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">{formatCents(item.discount_price_cent ?? item.unit_price_cent)}</td>
                <td className="p-3 text-right text-gray-500">{(item.vat_rate_snapshot / 100).toFixed(0)}%</td>
                <td className="p-3 text-right font-medium">{formatCents(item.row_total_cent)}</td>
                <td className="p-3 text-center">
                  {item.row_status === 'refunded' ? (
                    <span className="text-xs text-red-600 font-medium">Rimborsato ({formatCents(item.refund_cent)})</span>
                  ) : (
                    <span className="text-xs text-green-600">Attivo</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {item.row_status === 'active' && order.payment_status === 'paid' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      isLoading={refundingItemId === item.id}
                      onClick={() => setConfirmAction({ type: 'refund', payload: item.id })}
                    >
                      <RefreshCw size={12} className="mr-1" /> Rimborsa
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg border p-4 space-y-2">
        <div className="flex justify-between text-sm"><span>Subtotale</span><span>{formatCents(order.subtotal_cent)}</span></div>
        <div className="flex justify-between text-sm text-gray-500"><span>di cui IVA</span><span>{formatCents(order.vat_total_cent)}</span></div>
        {order.shipping_total_cent > 0 && (
          <div className="flex justify-between text-sm"><span>Spedizione</span><span>{formatCents(order.shipping_total_cent)}</span></div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Totale</span><span>{formatCents(order.grand_total_cent)}</span>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-1">Note cliente</h3>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-2">Conferma azione</h3>
            <p className="text-sm text-gray-600 mb-4">
              {confirmAction.type === 'refund'
                ? 'Sei sicuro di voler eseguire il rimborso Stripe per questo prodotto? Questa azione non è reversibile.'
                : `Sei sicuro di voler cambiare lo stato dell'ordine a "${ORDER_STATUS_LABELS_IT[confirmAction.payload as OrderStatus]}"?`}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Annulla</Button>
              <Button
                variant={confirmAction.type === 'refund' ? 'destructive' : 'default'}
                onClick={() => {
                  if (confirmAction.type === 'refund') handleRefund(confirmAction.payload as string);
                  else handleStatusChange(confirmAction.payload as OrderStatus);
                }}
              >
                Conferma
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
