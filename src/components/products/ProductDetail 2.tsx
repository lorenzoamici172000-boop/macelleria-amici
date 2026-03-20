'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, ShoppingCart, Truck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatCents, getEffectivePrice, getDiscountPercentage, formatVatRate } from '@/utils/currency';
import type { Product } from '@/types';

const PLACEHOLDER = '/images/product-placeholder.svg';

export function ProductDetail({ product }: { product: Product }) {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { settings } = useTheme();
  const { add: addToCart } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();
  const { trackProductView, trackCartAdd } = useAnalytics();

  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Track product view
  useEffect(() => {
    trackProductView(product.id);
  }, [product.id, trackProductView]);

  const effectivePrice = getEffectivePrice(product.price_cent, product.discount_price_cent);
  const discount = getDiscountPercentage(product.price_cent, product.discount_price_cent);
  const isOutOfStock = product.stock === 0;
  const images = product.images?.length ? product.images : [{ id: 'placeholder', url: PLACEHOLDER, alt_text: product.name, display_order: 0, product_id: product.id, created_at: '' }];

  const handleAddToCart = async () => {
    if (!user) { window.location.href = `/login?redirect=/prodotti/${product.slug}`; return; }
    setIsAdding(true);
    const success = await addToCart(product.id);
    if (success) {
      trackCartAdd(product.id);
      toast.success(t('products.addedToCart'));
    }
    setAddedToCart(true);
    setIsAdding(false);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleWishlist = async () => {
    if (!user) { window.location.href = `/login?redirect=/prodotti/${product.slug}`; return; }
    await toggleWishlist(product.id);
    toast.success(isInWishlist(product.id) ? t('products.removedFromWishlist') : t('products.addedToWishlist'));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/prodotti" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={16} /> {t('common.back')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-3">
            <Image
              src={images[selectedImage]?.url || PLACEHOLDER}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                -{discount}%
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 ${
                    idx === selectedImage ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Image src={img.url} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <p className="text-sm text-muted-foreground mb-1">{product.category.name}</p>
          )}
          <h1
            className="text-3xl mb-4"
            style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
          >
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-bold" style={{ color: settings.color_primary }}>
              {formatCents(effectivePrice, locale)}
            </span>
            {product.discount_price_cent && (
              <span className="text-lg text-muted-foreground line-through">
                {formatCents(product.price_cent, locale)}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            {t('products.vat')} ({formatVatRate(product.vat_rate)})
          </p>

          {/* Availability */}
          {isOutOfStock ? (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-6">
              {t('products.outOfStock')}
            </div>
          ) : (
            <p className="text-sm text-green-600 mb-6">
              Disponibile ({product.stock} pz)
            </p>
          )}

          {/* Fulfillment options */}
          <div className="flex flex-wrap gap-3 mb-6">
            {product.pickup_enabled && (
              <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-muted">
                <MapPin size={12} /> {t('checkout.pickup')}
              </span>
            )}
            {product.shipping_enabled && (
              <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-muted">
                <Truck size={12} /> {t('checkout.shipping')}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-8">
              <p className="text-sm text-foreground/80 font-body leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              isLoading={isAdding}
              size="lg"
              className="flex-1"
              style={{
                backgroundColor: isOutOfStock ? '#ccc' : settings.color_primary,
                color: isOutOfStock ? '#666' : settings.color_primary_foreground,
              }}
            >
              <ShoppingCart size={18} className="mr-2" />
              {addedToCart ? t('products.addedToCart') : t('products.addToCart')}
            </Button>
            <Button variant="outline" size="lg" onClick={handleWishlist}>
              <Heart size={18} className={isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
