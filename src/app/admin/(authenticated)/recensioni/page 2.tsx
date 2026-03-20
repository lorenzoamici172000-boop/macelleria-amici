'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAllReviews, toggleReviewVisibility, toggleReviewFeatured, getLastSyncLog } from '@/services/reviews';
import { Star, Eye, EyeOff, Award, RefreshCw } from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import { revalidatePublicPages } from '@/utils/revalidate';
import type { Review, ReviewSyncLog } from '@/types';

export default function AdminRecensioniPage() {
  const supabase = createClient();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [syncLog, setSyncLog] = useState<ReviewSyncLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const [revs, log] = await Promise.all([
      getAllReviews(supabase),
      getLastSyncLog(supabase),
    ]);
    setReviews(revs);
    setSyncLog(log);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [supabase]);

  const handleToggleVisibility = async (id: string, current: boolean) => {
    // Revalidation happens after load() below
    await toggleReviewVisibility(supabase, id, !current);
    load();
    revalidatePublicPages();
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    await toggleReviewFeatured(supabase, id, !current);
    load();
    revalidatePublicPages();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recensioni</h1>
        <span className="text-sm text-gray-500">{reviews.length} totali</span>
      </div>

      {/* Sync status */}
      {syncLog && (
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <RefreshCw size={18} className={syncLog.status === 'failed' ? 'text-red-500' : 'text-green-500'} />
          <div className="text-sm">
            <span className="font-medium">Ultima sincronizzazione: </span>
            <span className={syncLog.status === 'success' ? 'text-green-600' : 'text-red-600'}>
              {syncLog.status} — {formatDate(syncLog.created_at)}
            </span>
            {syncLog.reviews_imported > 0 && (
              <span className="text-gray-500"> ({syncLog.reviews_imported} importate)</span>
            )}
            {syncLog.error_message && (
              <p className="text-xs text-red-500 mt-1">{syncLog.error_message}</p>
            )}
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="bg-white rounded-lg border divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Caricamento...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessuna recensione</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className={`p-4 ${!review.is_visible ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{review.author_name}</span>
                    <span className="text-xs text-gray-400">{formatDate(review.review_date)}</span>
                    {review.is_featured && (
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">In evidenza</span>
                    )}
                  </div>
                  {review.text && (
                    <p className="text-sm text-gray-600 line-clamp-2">{review.text}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                    className={`p-1.5 rounded ${review.is_featured ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:text-yellow-600'}`}
                    title={review.is_featured ? 'Rimuovi evidenza' : 'Metti in evidenza'}
                  >
                    <Award size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(review.id, review.is_visible)}
                    className={`p-1.5 rounded ${review.is_visible ? 'text-green-600' : 'text-gray-400'}`}
                    title={review.is_visible ? 'Nascondi' : 'Mostra'}
                  >
                    {review.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
