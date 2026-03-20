import { createServerSupabase } from '@/lib/supabase/server';
import { getFeaturedReviews } from '@/services/reviews';
import { HeroSection } from '@/components/layout/HeroSection';
import { ReviewsPreview } from '@/components/reviews/ReviewsPreview';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServerSupabase();
  const reviews = await getFeaturedReviews(supabase, 5);

  return (
    <>
      <HeroSection />
      <ReviewsPreview reviews={reviews} />
    </>
  );
}
