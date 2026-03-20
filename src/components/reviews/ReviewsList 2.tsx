'use client';

import { Star } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import type { Review } from '@/types';
import { formatDate } from '@/utils/helpers';

interface ReviewsListProps {
  reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  const { t, locale } = useLocale();
  const { settings } = useTheme();

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl md:text-4xl mb-4"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {t('reviews.title')}
      </h1>

      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                className={i < Math.round(parseFloat(avgRating)) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}
              />
            ))}
          </div>
          <span className="text-lg font-bold">{avgRating}</span>
          <span className="text-sm text-muted-foreground">({reviews.length} {t('reviews.title').toLowerCase()})</span>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">{t('reviews.noReviews')}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-6 rounded-lg border border-border bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(review.review_date, locale)}
                </span>
              </div>
              {review.text && (
                <p className="text-sm text-foreground/80 font-body mb-3">{review.text}</p>
              )}
              <p className="text-sm font-medium text-foreground/60">{review.author_name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
