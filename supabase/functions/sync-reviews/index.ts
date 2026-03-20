// supabase/functions/sync-reviews/index.ts
// Deploy: supabase functions deploy sync-reviews
// Schedule: Run daily via Supabase cron or external scheduler

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') || '';
const GOOGLE_PLACE_ID = Deno.env.get('GOOGLE_PLACE_ID') || '';

serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Create sync log entry
  const { data: logEntry } = await supabase
    .from('review_sync_logs')
    .insert({ status: 'pending', reviews_imported: 0 })
    .select('id')
    .single();

  const logId = logEntry?.id;

  try {
    if (!GOOGLE_API_KEY || !GOOGLE_PLACE_ID) {
      throw new Error('Google API key or Place ID not configured');
    }

    // Fetch reviews from Google Places API (New)
    const url = `https://places.googleapis.com/v1/places/${GOOGLE_PLACE_ID}?fields=reviews&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url, {
      headers: { 'X-Goog-Api-Key': GOOGLE_API_KEY },
    });

    if (!response.ok) {
      throw new Error(`Google API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const reviews = data.reviews || [];

    let imported = 0;

    for (const review of reviews) {
      const googleReviewId = review.name || `${review.authorAttribution?.displayName}-${review.publishTime}`;

      // Upsert review
      const { error } = await supabase
        .from('reviews')
        .upsert({
          google_review_id: googleReviewId,
          author_name: review.authorAttribution?.displayName || 'Anonimo',
          rating: review.rating || 5,
          text: review.text?.text || review.originalText?.text || '',
          review_date: review.publishTime || new Date().toISOString(),
          source: 'google',
          is_visible: true,
        }, {
          onConflict: 'google_review_id',
        });

      if (!error) imported++;
    }

    // Update log
    if (logId) {
      await supabase
        .from('review_sync_logs')
        .update({ status: 'success', reviews_imported: imported })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ success: true, imported }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update log with error
    if (logId) {
      await supabase
        .from('review_sync_logs')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
