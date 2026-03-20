import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalyticsEvent, AnalyticsDailySummary } from '@/types';

export async function trackEvent(
  supabase: SupabaseClient,
  event: AnalyticsEvent
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      event_name: event.event_name,
      page_path: event.page_path ?? '',
      referrer: event.referrer ?? '',
      utm_source: event.utm_source ?? '',
      utm_medium: event.utm_medium ?? '',
      utm_campaign: event.utm_campaign ?? '',
      source_type: event.source_type ?? 'direct',
      user_id: event.user_id ?? null,
      session_id: event.session_id ?? '',
      product_id: event.product_id ?? null,
      metadata: event.metadata ?? {},
      is_admin: event.is_admin ?? false,
    });
  } catch (e) {
    // Analytics should never break the app
    console.error('Analytics tracking error:', e);
  }
}

export async function getDailySummaries(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<AnalyticsDailySummary[]> {
  const { data } = await supabase
    .from('analytics_daily_summary')
    .select('*')
    .gte('summary_date', startDate)
    .lte('summary_date', endDate)
    .order('summary_date', { ascending: true });

  return (data ?? []) as AnalyticsDailySummary[];
}

export async function getTodayStats(supabase: SupabaseClient): Promise<{
  pageViews: number;
  orders: number;
  registrations: number;
  whatsappClicks: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('analytics_daily_summary')
    .select('*')
    .eq('summary_date', today)
    .single();

  if (!data) return { pageViews: 0, orders: 0, registrations: 0, whatsappClicks: 0 };

  const summary = data as AnalyticsDailySummary;
  return {
    pageViews: summary.page_views,
    orders: summary.orders_created,
    registrations: summary.registrations,
    whatsappClicks: summary.whatsapp_clicks,
  };
}

export async function getMonthStats(supabase: SupabaseClient): Promise<{
  pageViews: number;
  orders: number;
  registrations: number;
  whatsappClicks: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const summaries = await getDailySummaries(supabase, startOfMonth!, endOfMonth!);

  return summaries.reduce(
    (acc, s) => ({
      pageViews: acc.pageViews + s.page_views,
      orders: acc.orders + s.orders_created,
      registrations: acc.registrations + s.registrations,
      whatsappClicks: acc.whatsappClicks + s.whatsapp_clicks,
    }),
    { pageViews: 0, orders: 0, registrations: 0, whatsappClicks: 0 }
  );
}
