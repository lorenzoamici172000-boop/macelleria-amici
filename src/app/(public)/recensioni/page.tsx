import { createServerSupabase } from '@/lib/supabase/server';
import { getVisibleReviews } from '@/services/reviews';
import { ReviewsList } from '@/components/reviews/ReviewsList';

export const revalidate = 3600; // 1 hour

export const metadata = { title: 'Recensioni' };

export default async function RecensioniPage() {
  const supabase = createServerSupabase();
  const reviews = await getVisibleReviews(supabase);

  return <ReviewsList reviews={reviews} />;
}
