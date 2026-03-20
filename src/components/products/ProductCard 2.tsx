'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { formatCents, getEffectivePrice, getDiscountPercentage } from '@/utils/currency';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  isInWishlist?: boolean;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
}

const PLACEHOLDER_IMAGE = '/images/product-placeholder.svg';

export function ProductCard({ product, isInWishlist, onAddToCart, onToggleWishlist }: ProductCardProps) {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { settings } = useTheme();

  const effectivePrice = getEffectivePrice(product.price_cent, product.discount_price_cent);
  const discount = getDiscountPercentage(product.price_cent, product.discount_price_cent);
  const isOutOfStock = product.stock === 0;
  const mainImage = product.images?.[0]?.url || PLACEHOLDER_IMAGE;

  const handleAddToCart = () => {
    if (!user) {
      window.location.href = `/login?redirect=/prodotti/${product.slug}`;
      return;
    }
    onAddToCart?.(product.id);
  };

  const handleToggleWishlist = () => {
    if (!user) {
      window.location.href = `/login?redirect=/prodotti/${product.slug}`;
      return;
    }
    onToggleWishlist?.(product.id);
  };

  return (
    <div className="group bg-white rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <Link href={`/prodotti/${product.slug}`} className="block relative aspect-square overflow-hidden bg-muted">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
            -{discount}%
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 px-3 py-1 rounded text-sm font-medium">
              {t('products.outOfStock')}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/prodotti/${product.slug}`}>
          <h3
            className="font-display text-lg mb-1 line-clamp-1 hover:opacity-80 transition-opacity"
            style={{ color: settings.color_primary }}
          >
            {product.name}
          </h3>
        </Link>

        {product.category && (
          <p className="text-xs text-muted-foreground mb-2">{product.category.name}</p>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold" style={{ color: settings.color_primary }}>
            {formatCents(effectivePrice, locale)}
          </span>
          {product.discount_price_cent && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCents(product.price_cent, locale)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isOutOfStock ? '#ccc' : settings.color_primary,
              color: isOutOfStock ? '#666' : settings.color_primary_foreground,
            }}
          >
            <ShoppingCart size={16} />
            {t('products.addToCart')}
          </button>
          <button
            onClick={handleToggleWishlist}
            className="p-2 rounded border border-border hover:bg-muted transition-colors"
            title={t('products.addToWishlist')}
          >
            <Heart
              size={18}
              className={isInWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
