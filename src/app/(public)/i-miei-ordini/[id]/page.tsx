'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getOrderById } from '@/services/orders';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { formatCents } from '@/utils/currency';
import { formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '@/utils/helpers';
import { ORDER_STATUS_LABELS_IT, ORDER_STATUS_LABELS_EN, PAYMENT_STATUS_LABELS_IT, PAYMENT_STATUS_LABELS_EN } from '@/types';
import type { Order } from '@/types';

export default function OrderDetailPage() {
  const params = useParams();
  const supabase = createClient();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { settings } = useTheme();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !params.id) return;
      const data = await getOrderById(supabase, params.id as string, user.id);
      setOrder(data);
      setIsLoading(false);
    };
    load();
  }, [user, params.id, supabase]);

  const statusLabels = locale === 'it' ? ORDER_STATUS_LABELS_IT : ORDER_STATUS_LABELS_EN;
  const paymentLabels = locale === 'it' ? PAYMENT_STATUS_LABELS_IT : PAYMENT_STATUS_LABELS_EN;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">Ordine non trovato</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/i-miei-ordini" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={16} /> {t('common.back')}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t('orders.order')} #{order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDateTime(order.created_at, locale)}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer size={16} className="mr-1" /> {t('orders.print')}
          </Button>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.order_status)}`}>
          {statusLabels[order.order_status]}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
          {paymentLabels[order.payment_status]}
        </span>
        {order.order_type === 'in_store_payment' && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            {t('orders.reservation')}
          </span>
        )}
        {order.invoice_requested && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {t('checkout.invoiceRequest')}
          </span>
        )}
      </div>

      {/* Related order */}
      {order.related_order_id && (
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm mb-6">
          Questo ordine è collegato a un altro ordine (divisione ordine misto).
        </div>
      )}

      {/* Items */}
      <div className="rounded-lg border border-border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">Prodotto</th>
              <th className="text-center p-3">Qtà</th>
              <th className="text-right p-3">Prezzo</th>
              <th className="text-right p-3">IVA</th>
              <th className="text-right p-3">Totale</th>
              <th className="text-center p-3">Stato</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items?.map((item) => (
              <tr key={item.id} className={item.row_status === 'refunded' ? 'opacity-50 line-through' : ''}>
                <td className="p-3">{item.product_name_snapshot}</td>
                <td className="p-3 text-center">{item.quantity}</td>
                <td className="p-3 text-right">{formatCents(item.discount_price_cent ?? item.unit_price_cent, locale)}</td>
                <td className="p-3 text-right text-muted-foreground">{(item.vat_rate_snapshot / 100).toFixed(0)}%</td>
                <td className="p-3 text-right font-medium">{formatCents(item.row_total_cent, locale)}</td>
                <td className="p-3 text-center">
                  {item.row_status === 'refunded' && (
                    <span className="text-xs text-red-600">Rimborsato</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="rounded-lg border border-border p-4 space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span>{t('cart.subtotal')}</span>
          <span>{formatCents(order.subtotal_cent, locale)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t('checkout.vatTotal')}</span>
          <span>{formatCents(order.vat_total_cent, locale)}</span>
        </div>
        {order.shipping_total_cent > 0 && (
          <div className="flex justify-between text-sm">
            <span>{t('checkout.shippingCost')}</span>
            <span>{formatCents(order.shipping_total_cent, locale)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>{t('checkout.grandTotal')}</span>
          <span style={{ color: settings.color_primary }}>{formatCents(order.grand_total_cent, locale)}</span>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-lg border border-border p-4 mb-6">
          <h3 className="text-sm font-medium mb-1">{t('checkout.notes')}</h3>
          <p className="text-sm text-muted-foreground">{order.notes}</p>
        </div>
      )}

      {/* Pickup info */}
      {order.fulfillment_type === 'pickup' && (order.pickup_date || order.pickup_slot) && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium mb-2">{t('checkout.pickup')}</h3>
          {order.pickup_date && <p className="text-sm">Data: {order.pickup_date}</p>}
          {order.pickup_slot && <p className="text-sm">Fascia: {order.pickup_slot}</p>}
        </div>
      )}
    </div>
  );
}
