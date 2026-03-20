// supabase/functions/aggregate-stats/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;

  try {
    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .eq('is_admin', false);

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ date: dateStr, events: 0 }));
    }

    const pageViews = events.filter(e => e.event_name === 'page_view').length;
    const uniqueVisitors = new Set(events.filter(e => e.session_id).map(e => e.session_id)).size;
    const registrations = events.filter(e => e.event_name === 'registration_complete').length;
    const logins = events.filter(e => e.event_name === 'login_success').length;
    const ordersCreated = events.filter(e => e.event_name === 'order_created').length;
    const ordersCompleted = events.filter(e => e.event_name === 'order_completed').length;
    const whatsappClicks = events.filter(e => e.event_name === 'whatsapp_click').length;
    const facebookClicks = events.filter(e => e.event_name === 'facebook_click').length;
    const instagramClicks = events.filter(e => e.event_name === 'instagram_click').length;
    const heroCta = events.filter(e => e.event_name === 'hero_cta_click').length;
    const reviewsCta = events.filter(e => e.event_name === 'reviews_cta_click').length;
    const checkoutStarts = events.filter(e => e.event_name === 'checkout_start').length;
    const checkoutCompletes = events.filter(e => e.event_name === 'checkout_complete').length;

    // Product views
    const productViews: Record<string, number> = {};
    events.filter(e => e.event_name === 'product_view' && e.product_id).forEach(e => {
      productViews[e.product_id!] = (productViews[e.product_id!] || 0) + 1;
    });

    // Cart additions
    const cartAdditions: Record<string, number> = {};
    events.filter(e => e.event_name === 'cart_add' && e.product_id).forEach(e => {
      cartAdditions[e.product_id!] = (cartAdditions[e.product_id!] || 0) + 1;
    });

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    events.forEach(e => {
      const src = e.source_type || 'direct';
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
    });

    await supabase.from('analytics_daily_summary').upsert({
      summary_date: dateStr,
      page_views: pageViews,
      unique_visitors: uniqueVisitors,
      registrations,
      logins,
      orders_created: ordersCreated,
      orders_completed: ordersCompleted,
      whatsapp_clicks: whatsappClicks,
      facebook_clicks: facebookClicks,
      instagram_clicks: instagramClicks,
      hero_cta_clicks: heroCta,
      reviews_cta_clicks: reviewsCta,
      product_views: productViews,
      cart_additions: cartAdditions,
      checkout_starts: checkoutStarts,
      checkout_completes: checkoutCompletes,
      source_breakdown: sourceBreakdown,
    }, { onConflict: 'summary_date' });

    return new Response(JSON.stringify({
      success: true,
      date: dateStr,
      page_views: pageViews,
      events_processed: events.length,
    }));

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown',
    }), { status: 500 });
  }
});
