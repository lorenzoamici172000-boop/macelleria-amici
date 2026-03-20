'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getUserOrders } from '@/services/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { formatCents } from '@/utils/currency';
import { formatDate, getOrderStatusColor } from '@/utils/helpers';
import { ORDER_STATUS_LABELS_IT, ORDER_STATUS_LABELS_EN, PAYMENT_STATUS_LABELS_IT, PAYMENT_STATUS_LABELS_EN } from '@/types';
import type { Order, OrderStatus } from '@/types';

export default function IMieiOrdiniPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { settings } = useTheme();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      const data = await getUserOrders(supabase, user.id, {
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setOrders(data);
      setIsLoading(false);
    };
    load();
  }, [user, search, statusFilter, supabase]);

  const statusLabels = locale === 'it' ? ORDER_STATUS_LABELS_IT : ORDER_STATUS_LABELS_EN;
  const paymentLabels = locale === 'it' ? PAYMENT_STATUS_LABELS_IT : PAYMENT_STATUS_LABELS_EN;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl mb-8"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {t('orders.title')}
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('orders.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="h-10 px-3 rounded-md border border-border bg-background text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
        >
          <option value="">Tutti gli stati</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">{t('orders.noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/i-miei-ordini/${order.id}`}
              className="block p-4 rounded-lg border border-border hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t('orders.order')} #{order.order_number}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(order.created_at, locale)} — {order.order_type === 'in_store_payment'
                      ? t('orders.reservation')
                      : t('orders.onlineOrder')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCents(order.grand_total_cent, locale)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOrderStatusColor(order.order_status)}`}>
                      {statusLabels[order.order_status]}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
