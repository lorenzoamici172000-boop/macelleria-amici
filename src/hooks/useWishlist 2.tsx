'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getWishlistItems, addToWishlist, removeFromWishlist } from '@/services/wishlist';
import { useAuth } from '@/hooks/useAuth';

interface WishlistContextValue {
  wishlistIds: Set<string>;
  itemCount: number;
  isLoading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue>({
  wishlistIds: new Set(),
  itemCount: 0,
  isLoading: true,
  isInWishlist: () => false,
  toggle: async () => {},
  refresh: async () => {},
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { user, isLoading: authLoading } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setWishlistIds(new Set());
      setIsLoading(false);
      return;
    }
    try {
      const items = await getWishlistItems(supabase, user.id);
      setWishlistIds(new Set(items.map(i => i.product_id)));
    } catch {
      setWishlistIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  const isInWishlistFn = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  const toggle = useCallback(async (productId: string) => {
    if (!user) return;
    if (wishlistIds.has(productId)) {
      await removeFromWishlist(supabase, user.id, productId);
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } else {
      await addToWishlist(supabase, user.id, productId);
      setWishlistIds(prev => new Set(prev).add(productId));
    }
  }, [supabase, user, wishlistIds]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        itemCount: wishlistIds.size,
        isLoading: isLoading || authLoading,
        isInWishlist: isInWishlistFn,
        toggle,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
