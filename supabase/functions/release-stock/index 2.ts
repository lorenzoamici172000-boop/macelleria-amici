// supabase/functions/release-stock/index.ts
// Deploy: supabase functions deploy release-stock
// Schedule: Every 5 minutes via pg_cron or external scheduler

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { data: count, error } = await supabase.rpc('release_expired_reservations');

    if (error) {
      console.error('Stock release error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const released = count ?? 0;

    if (released > 0) {
      console.log(`Released ${released} expired stock reservations`);

      // Log the operation
      await supabase.from('admin_audit_logs').insert({
        admin_id: '00000000-0000-0000-0000-000000000000', // system
        action: 'stock_release_cron',
        entity_type: 'stock_reservations',
        new_value: { released, timestamp: new Date().toISOString() },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        released,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Stock release exception:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
