'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCart, updateCartItemQuantity, removeCartItem, type CartWithItems } from '@/services/cart';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { formatCents, getEffectivePrice } from '@/utils/currency';

export default function CarrelloPage() {
  const supabase = createClient();
  const { user, isLoading: authLoading } = useAuth();
  const { t, locale } = useLocale();
  const { settings } = useTheme();

  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    const data = await getCart(supabase, user.id);
    setCart(data);
    setIsLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (!authLoading) fetchCart();
  }, [authLoading, fetchCart]);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    setUpdatingId(itemId);
    await updateCartItemQuantity(supabase, itemId, newQty);
    await fetchCart();
    setUpdatingId(null);
  };

  const handleRemove = async (itemId: string) => {
    setUpdatingId(itemId);
    await removeCartItem(supabase, itemId);
    await fetchCart();
    setUpdatingId(null);
  };

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, item) => {
    if (!item.product?.is_active) return sum;
    const price = getEffectivePrice(item.product.price_cent, item.product.discount_price_cent);
    return sum + price * item.quantity;
  }, 0);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl mb-8"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {t('cart.title')}
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-4" style={{ color: settings.color_primary }}>
            {t('cart.empty')}
          </p>
          <Link href="/prodotti">
            <Button style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}>
              {t('cart.goToProducts')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const product = item.product;
            const isUnavailable = !product || !product.is_active || product.stock === 0;
            const effectivePrice = product ? getEffectivePrice(product.price_cent, product.discount_price_cent) : 0;
            const imageUrl = product?.images?.[0]?.url || '/images/product-placeholder.svg';

            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${isUnavailable ? 'border-red-200 bg-red-50/50' : 'border-border'}`}
              >
                <Image
                  src={imageUrl}
                  alt={product?.name || ''}
                  width={80}
                  height={80}
                  className="rounded-md object-cover w-20 h-20"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{product?.name || 'Prodotto rimosso'}</h3>
                  {isUnavailable ? (
                    <p className="text-sm text-red-600">{t('cart.productUnavailable')}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {formatCents(effectivePrice, locale)} × {item.quantity}
                    </p>
                  )}
                </div>

                {/* Quantity controls */}
                {!isUnavailable && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={updatingId === item.id || item.quantity <= 1}
                      className="p-1 rounded border hover:bg-muted disabled:opacity-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={updatingId === item.id || item.quantity >= (product?.stock ?? 0)}
                      className="p-1 rounded border hover:bg-muted disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}

                {/* Row total */}
                {!isUnavailable && (
                  <span className="font-bold text-sm whitespace-nowrap">
                    {formatCents(effectivePrice * item.quantity, locale)}
                  </span>
                )}

                {/* Remove */}
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={updatingId === item.id}
                  className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                  title={t('cart.remove')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}

          {/* Summary */}
          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>{t('cart.subtotal')}</span>
              <span style={{ color: settings.color_primary }}>{formatCents(subtotal, locale)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('products.vat')}</p>
          </div>

          <Link href="/checkout" className="block mt-4">
            <Button
              className="w-full"
              size="lg"
              style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}
            >
              {t('cart.checkout')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
