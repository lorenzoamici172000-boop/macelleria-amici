'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { Review } from '@/types';
import { timeAgo } from '@/utils/helpers';

interface ReviewsPreviewProps {
  reviews: Review[];
}

export function ReviewsPreview({ reviews }: ReviewsPreviewProps) {
  const { t, locale } = useLocale();
  const { settings } = useTheme();
  const { trackReviewsCta } = useAnalytics();

  if (!settings.reviews_section_enabled) return null;

  return (
    <section className="py-16 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          className="text-3xl md:text-4xl text-center mb-10"
          style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
        >
          {t('reviews.title')}
        </h2>

        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground font-body">
            {t('reviews.noReviews')}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.slice(0, 5).map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
              >
                {/* Stars */}
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}
                    />
                  ))}
                </div>

                {/* Text */}
                {review.text && (
                  <p className="text-sm text-foreground/80 font-body mb-4 line-clamp-4">
                    &ldquo;{review.text}&rdquo;
                  </p>
                )}

                {/* Author & Date */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{review.author_name}</span>
                  <span>{timeAgo(review.review_date, locale)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* See more button */}
        <div className="text-center mt-8">
          <Link
            href="/recensioni"
            onClick={trackReviewsCta}
            className="inline-flex items-center px-6 py-3 rounded font-display text-sm transition-all hover:scale-105"
            style={{
              backgroundColor: settings.color_primary,
              color: settings.color_primary_foreground,
            }}
          >
            {settings.reviews_button_text || t('reviews.seeMore')}
          </Link>
        </div>
      </div>
    </section>
  );
}
