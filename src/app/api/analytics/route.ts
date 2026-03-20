import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { z } from 'zod';

const eventSchema = z.object({
  event_name: z.string().min(1).max(100),
  page_path: z.string().max(500).optional(),
  referrer: z.string().max(1000).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  source_type: z.string().max(50).optional(),
  product_id: z.string().uuid().optional(),
  session_id: z.string().max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = eventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const supabase = createAdminSupabase();
    await supabase.from('analytics_events').insert({
      ...validation.data,
      is_admin: false,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Never fail analytics
  }
}
