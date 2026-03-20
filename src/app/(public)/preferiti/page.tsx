'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getWishlistItems, removeFromWishlist } from '@/services/wishlist';
import { addToCart } from '@/services/cart';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import type { WishlistItem, Product } from '@/types';

export default function PreferitiPage() {
  const supabase = createClient();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLocale();
  const { settings } = useTheme();

  const [items, setItems] = useState<(WishlistItem & { product: Product })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    const data = await getWishlistItems(supabase, user.id);
    setItems(data);
    setWishlistIds(new Set(data.map(i => i.product_id)));
    setIsLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (!authLoading) fetchItems();
  }, [authLoading, fetchItems]);

  const handleToggleWishlist = async (productId: string) => {
    if (!user) return;
    await removeFromWishlist(supabase, user.id, productId);
    setWishlistIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
    setItems(prev => prev.filter(i => i.product_id !== productId));
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) return;
    await addToCart(supabase, user.id, productId);
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse h-8 w-48 bg-muted rounded mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg aspect-[3/4]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl mb-8"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {t('wishlist.title')}
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground mb-4">{t('wishlist.empty')}</p>
          <Link href="/prodotti">
            <Button style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}>
              {t('wishlist.goToProducts')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              product={item.product}
              isInWishlist={wishlistIds.has(item.product_id)}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
