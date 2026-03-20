'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getDailySummaries, getTodayStats, getMonthStats } from '@/services/analytics';
import { TrendingUp, ShoppingCart, Users, MessageCircle, BarChart3 } from 'lucide-react';
import type { AnalyticsDailySummary } from '@/types';

export default function AdminStatistichePage() {
  const supabase = createClient();
  const [today, setToday] = useState({ pageViews: 0, orders: 0, registrations: 0, whatsappClicks: 0 });
  const [month, setMonth] = useState({ pageViews: 0, orders: 0, registrations: 0, whatsappClicks: 0 });
  const [dailyData, setDailyData] = useState<AnalyticsDailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const end = new Date();
      const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000);

      const [todayData, monthData, daily] = await Promise.all([
    getTodayStats(supabase),
    getMonthStats(supabase),
    getDailySummaries(supabase, start.toISOString().split('T')[0]!, end.toISOString().split('T')[0]!),
      ]);
      setToday(todayData);
      setMonth(monthData);
      setDailyData(daily);
      setIsLoading(false);
    };
    load();
  }, [supabase, period]);

  const maxViews = Math.max(...dailyData.map(d => d.page_views), 1);
  const maxOrders = Math.max(...dailyData.map(d => d.orders_created), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Statistiche</h1>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded text-sm ${period === p ? 'bg-gray-900 text-white' : 'bg-white border hover:bg-gray-50'}`}
            >
              {p === '7d' ? '7 giorni' : p === '30d' ? '30 giorni' : '90 giorni'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI icon={TrendingUp} label="Visite oggi" value={today.pageViews} />
            <KPI icon={TrendingUp} label="Visite mese" value={month.pageViews} />
            <KPI icon={ShoppingCart} label="Ordini oggi" value={today.orders} />
            <KPI icon={ShoppingCart} label="Ordini mese" value={month.orders} />
            <KPI icon={Users} label="Registrazioni mese" value={month.registrations} />
            <KPI icon={MessageCircle} label="Click WhatsApp" value={month.whatsappClicks} />
          </div>

          {/* Page Views Chart (simple bar) */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 size={18} /> Visite giornaliere</h2>
            {dailyData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nessun dato disponibile</p>
            ) : (
              <div className="flex items-end gap-1 h-40 overflow-x-auto">
                {dailyData.map((d) => (
                  <div key={d.summary_date} className="flex flex-col items-center flex-shrink-0" style={{ width: `${100 / Math.min(dailyData.length, 30)}%`, minWidth: '12px' }}>
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                      style={{ height: `${(d.page_views / maxViews) * 100}%`, minHeight: d.page_views > 0 ? '4px' : '0' }}
                      title={`${d.summary_date}: ${d.page_views} visite`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders Chart */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><ShoppingCart size={18} /> Ordini giornalieri</h2>
            {dailyData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nessun dato disponibile</p>
            ) : (
              <div className="flex items-end gap-1 h-40 overflow-x-auto">
                {dailyData.map((d) => (
                  <div key={d.summary_date} className="flex flex-col items-center flex-shrink-0" style={{ width: `${100 / Math.min(dailyData.length, 30)}%`, minWidth: '12px' }}>
                    <div
                      className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                      style={{ height: `${(d.orders_created / maxOrders) * 100}%`, minHeight: d.orders_created > 0 ? '4px' : '0' }}
                      title={`${d.summary_date}: ${d.orders_created} ordini`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Source breakdown */}
          {dailyData.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold mb-4">Sorgenti traffico (periodo)</h2>
              {(() => {
                const sources: Record<string, number> = {};
                dailyData.forEach(d => {
                  Object.entries(d.source_breakdown || {}).forEach(([src, count]) => {
                    sources[src] = (sources[src] || 0) + (count as number);
                  });
                });
                const entries = Object.entries(sources).sort((a, b) => b[1] - a[1]);
                if (entries.length === 0) return <p className="text-gray-500">Nessun dato</p>;
                const total = entries.reduce((s, [, c]) => s + c, 0);
                return (
                  <div className="space-y-2">
                    {entries.map(([src, count]) => (
                      <div key={src} className="flex items-center gap-3">
                        <span className="text-sm w-24 capitalize">{src}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(count / total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center gap-2 mb-2">
    <Icon size={16} className="text-gray-400" />
    <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
