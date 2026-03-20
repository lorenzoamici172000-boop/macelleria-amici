import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';

// Called by cron job every 5 minutes
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabase();
    const { data: count, error } = await supabase.rpc('release_expired_reservations');

    if (error) {
      console.error('Stock release error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ released: count, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Stock release exception:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
