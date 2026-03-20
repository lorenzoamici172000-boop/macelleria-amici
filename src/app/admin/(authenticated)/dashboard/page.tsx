'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getReservations, getFailedRefunds, getAllOrders } from '@/services/orders';
import { getOutOfStockProducts, getLowStockProducts } from '@/services/products';
import { getLastSyncLog } from '@/services/reviews';
import { getTodayStats, getMonthStats } from '@/services/analytics';
import { getReservationAge, getReservationAgeColor, getReservationAgeLabel, formatDateTime, getOrderStatusColor } from '@/utils/helpers';
import { formatCents } from '@/utils/currency';
import { AlertTriangle, Package, ShoppingCart, Users, TrendingUp, Clock, RefreshCw, MessageCircle } from 'lucide-react';
import type { Order, Product, ReviewSyncLog } from '@/types';

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [reservations, setReservations] = useState<Order[]>([]);
  const [failedRefunds, setFailedRefunds] = useState<Order[]>([]);
  const [outOfStock, setOutOfStock] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [syncLog, setSyncLog] = useState<ReviewSyncLog | null>(null);
  const [todayStats, setTodayStats] = useState({ pageViews: 0, orders: 0, registrations: 0, whatsappClicks: 0 });
  const [monthStats, setMonthStats] = useState({ pageViews: 0, orders: 0, registrations: 0, whatsappClicks: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
    const [res, refunds, oos, ls, sync, today, month] = await Promise.all([
      getReservations(supabase),
      getFailedRefunds(supabase),
      getOutOfStockProducts(supabase),
      getLowStockProducts(supabase),
      getLastSyncLog(supabase),
      getTodayStats(supabase),
      getMonthStats(supabase),
    ]);
    setReservations(res);
    setFailedRefunds(refunds);
    setOutOfStock(oos);
    setLowStock(ls);
    setSyncLog(sync);
    setTodayStats(today);
    setMonthStats(month);
      } catch (e) {
    console.error('Dashboard load error:', e);
      } finally {
    setIsLoading(false);
      }
    };
    load();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="space-y-6">
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-24 bg-white rounded-lg animate-pulse" />
      ))}
    </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Alerts */}
      {(failedRefunds.length > 0 || (syncLog?.status === 'failed')) && (
    <div className="space-y-2">
      {failedRefunds.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {failedRefunds.length} rimborso/i fallito/i da rifare
            </p>
            <Link href="/admin/ordini?filter=refund_failed" className="text-xs text-red-600 underline">
              Gestisci
            </Link>
          </div>
        </div>
      )}
      {syncLog?.status === 'failed' && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <RefreshCw size={20} className="text-yellow-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Sincronizzazione recensioni fallita
            </p>
            <p className="text-xs text-yellow-600">{syncLog.error_message}</p>
          </div>
        </div>
      )}
    </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <KPICard icon={TrendingUp} label="Visite oggi" value={todayStats.pageViews} />
    <KPICard icon={TrendingUp} label="Visite mese" value={monthStats.pageViews} />
    <KPICard icon={ShoppingCart} label="Ordini oggi" value={todayStats.orders} />
    <KPICard icon={ShoppingCart} label="Ordini mese" value={monthStats.orders} />
    <KPICard icon={Users} label="Registrazioni mese" value={monthStats.registrations} />
    <KPICard icon={MessageCircle} label="Click WhatsApp" value={monthStats.whatsappClicks} />
    <KPICard icon={Package} label="Prodotti esauriti" value={outOfStock.length} alert={outOfStock.length > 0} />
    <KPICard icon={Package} label="Stock basso" value={lowStock.length} alert={lowStock.length > 0} />
      </div>

      {/* Reservations - Main focus */}
      <div className="bg-white rounded-lg border shadow-sm">
    <div className="p-4 border-b">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Clock size={20} />
        Prenotazioni da gestire ({reservations.length})
      </h2>
    </div>
    <div className="divide-y">
      {reservations.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Nessuna prenotazione da gestire
        </div>
      ) : (
        reservations.map((order) => {
          const age = getReservationAge(order.created_at);
          return (
            <div key={order.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
              {/* Age badge */}
              <span className={`px-2 py-1 rounded text-xs font-medium border ${getReservationAgeColor(age)}`}>
                {getReservationAgeLabel(age)}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  Ordine #{order.order_number}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(order.created_at)} — {(order as unknown as { user?: { first_name?: string; last_name?: string } }).user?.first_name} {(order as unknown as { user?: { first_name?: string; last_name?: string } }).user?.last_name}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-sm">{formatCents(order.grand_total_cent)}</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${getOrderStatusColor(order.order_status)}`}>
                  {order.order_status}
                </span>
              </div>

              <Link
                href={`/admin/ordini/${order.id}`}
                className="px-3 py-1 text-xs rounded bg-gray-900 text-white hover:bg-gray-800"
              >
                Gestisci
              </Link>
            </div>
          );
        })
      )}
    </div>
      </div>

      {/* Out of Stock products */}
      {outOfStock.length > 0 && (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Prodotti esauriti</h2>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {outOfStock.map(p => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span>{p.name}</span>
              <Link href={`/admin/prodotti/${p.id}`} className="text-blue-600 hover:underline text-xs">
                Modifica
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
      )}

      {/* Sync status */}
      {syncLog && (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <h3 className="text-sm font-semibold mb-2">Ultima sincronizzazione recensioni</h3>
      <div className="text-xs text-gray-500 space-y-1">
        <p>Stato: <span className={syncLog.status === 'success' ? 'text-green-600' : 'text-red-600'}>{syncLog.status}</span></p>
        <p>Recensioni importate: {syncLog.reviews_imported}</p>
        <p>Data: {formatDateTime(syncLog.created_at)}</p>
      </div>
    </div>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, alert = false }: {
  icon: React.ElementType;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border shadow-sm ${alert ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
      <div className="flex items-center gap-2 mb-2">
    <Icon size={16} className={alert ? 'text-red-500' : 'text-gray-400'} />
    <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${alert ? 'text-red-700' : 'text-gray-900'}`}>
    {value}
      </p>
    </div>
  );
}
