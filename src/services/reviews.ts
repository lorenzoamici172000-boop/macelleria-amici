import type { SupabaseClient } from '@supabase/supabase-js';
import type { Review, ReviewSyncLog } from '@/types';

export async function getVisibleReviews(
  supabase: SupabaseClient,
  limit?: number
): Promise<Review[]> {
  let query = supabase
    .from('reviews')
    .select('*')
    .eq('is_visible', true)
    .order('review_date', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data } = await query;
  return (data ?? []) as Review[];
}

export async function getFeaturedReviews(
  supabase: SupabaseClient,
  limit: number = 5
): Promise<Review[]> {
  // First try featured, then fallback to most recent
  const { data: featured } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_visible', true)
    .eq('is_featured', true)
    .order('review_date', { ascending: false })
    .limit(limit);

  if (featured && featured.length >= limit) return featured as Review[];

  // Fill remaining with recent
  const existingIds = (featured ?? []).map(r => r.id);
  const remaining = limit - (featured?.length ?? 0);

  const { data: recent } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_visible', true)
    .not('id', 'in', `(${existingIds.join(',')})`)
    .order('review_date', { ascending: false })
    .limit(remaining);

  return [...(featured ?? []), ...(recent ?? [])] as Review[];
}

export async function getLastSyncLog(supabase: SupabaseClient): Promise<ReviewSyncLog | null> {
  const { data } = await supabase
    .from('review_sync_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data as ReviewSyncLog | null;
}

export async function getAllReviews(supabase: SupabaseClient): Promise<Review[]> {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .order('review_date', { ascending: false });

  return (data ?? []) as Review[];
}

export async function toggleReviewVisibility(
  supabase: SupabaseClient,
  reviewId: string,
  isVisible: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('reviews')
    .update({ is_visible: isVisible })
    .eq('id', reviewId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleReviewFeatured(
  supabase: SupabaseClient,
  reviewId: string,
  isFeatured: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('reviews')
    .update({ is_featured: isFeatured })
    .eq('id', reviewId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
