'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCart, addToCart, updateCartItemQuantity, removeCartItem, clearCart, type CartWithItems } from '@/services/cart';
import { useAuth } from '@/hooks/useAuth';

interface CartContextValue {
  cart: CartWithItems | null;
  itemCount: number;
  isLoading: boolean;
  add: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  cart: null,
  itemCount: 0,
  isLoading: true,
  add: async () => false,
  updateQuantity: async () => {},
  remove: async () => {},
  clear: async () => {},
  refresh: async () => {},
});

export function CartProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await getCart(supabase, user.id);
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  const add = useCallback(async (productId: string, quantity: number = 1) => {
    if (!user) return false;
    const result = await addToCart(supabase, user.id, productId, quantity);
    if (result.success) await refresh();
    return result.success;
  }, [supabase, user, refresh]);

  const updateQty = useCallback(async (itemId: string, quantity: number) => {
    await updateCartItemQuantity(supabase, itemId, quantity);
    await refresh();
  }, [supabase, refresh]);

  const remove = useCallback(async (itemId: string) => {
    await removeCartItem(supabase, itemId);
    await refresh();
  }, [supabase, refresh]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    await clearCart(supabase, user.id);
    await refresh();
  }, [supabase, user, refresh]);

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading: isLoading || authLoading,
        add,
        updateQuantity: updateQty,
        remove,
        clear: clearAll,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
