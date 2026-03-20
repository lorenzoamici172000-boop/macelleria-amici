'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getProducts, getCategories } from '@/services/products';
import { addToCart } from '@/services/cart';
import { addToWishlist, removeFromWishlist, getWishlistItems } from '@/services/wishlist';
import { trackEvent } from '@/services/analytics';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { debounce } from '@/utils/helpers';
import type { Product, Category, ProductFilters, ProductSortOption } from '@/types';

export default function ProdottiPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const { t } = useLocale();
  const { settings } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategoriesList] = useState<Category[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: undefined,
    sortBy: 'name_asc',
    onlyAvailable: false,
    onlyDiscounted: false,
    onlyShippable: false,
    onlyPickup: false,
  });

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const result = await getProducts(supabase, filters, { page, pageSize: 10 });
    setProducts(result.products);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    setIsLoading(false);
  }, [supabase, filters, page]);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    const items = await getWishlistItems(supabase, user.id);
    setWishlistIds(new Set(items.map(i => i.product_id)));
  }, [supabase, user]);

  useEffect(() => {
    getCategories(supabase).then(setCategoriesList);
    fetchWishlist();
    trackEvent(supabase, { event_name: 'page_view', page_path: '/prodotti' });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setFilters(prev => ({ ...prev, search: value }));
      setPage(1);
    }, 300),
    []
  );

  const handleAddToCart = async (productId: string) => {
    if (!user) return;
    const result = await addToCart(supabase, user.id, productId);
    if (result.success) {
      trackEvent(supabase, { event_name: 'cart_add', product_id: productId, user_id: user.id });
      // Show toast/notification
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!user) return;
    if (wishlistIds.has(productId)) {
      await removeFromWishlist(supabase, user.id, productId);
      setWishlistIds(prev => { const next = new Set(prev); next.delete(productId); return next; });
    } else {
      await addToWishlist(supabase, user.id, productId);
      setWishlistIds(prev => new Set(prev).add(productId));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl md:text-4xl mb-8"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {t('products.title')}
      </h1>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('products.search')}
            className="pl-10"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>

        {/* Category select */}
        <select
          className="h-10 px-3 rounded-md border border-border bg-background text-sm"
          value={filters.category || ''}
          onChange={(e) => { setFilters(prev => ({ ...prev, category: e.target.value || undefined })); setPage(1); }}
        >
          <option value="">{t('products.allCategories')}</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          className="h-10 px-3 rounded-md border border-border bg-background text-sm"
          value={filters.sortBy || 'name_asc'}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as ProductSortOption }))}
        >
          <option value="name_asc">{t('products.sort.name')}</option>
          <option value="price_asc">{t('products.sort.priceAsc')}</option>
          <option value="price_desc">{t('products.sort.priceDesc')}</option>
          <option value="newest">{t('products.sort.newest')}</option>
          <option value="discount_desc">{t('products.sort.discount')}</option>
          <option value="available_first">{t('products.sort.available')}</option>
        </select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <Filter size={18} />
        </Button>
      </div>

      {/* Extended Filters */}
      {filtersOpen && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-muted/30 animate-slide-down">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(e) => { setFilters(prev => ({ ...prev, onlyAvailable: e.target.checked })); setPage(1); }}
                className="rounded"
              />
              {t('products.onlyAvailable')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.onlyDiscounted}
                onChange={(e) => { setFilters(prev => ({ ...prev, onlyDiscounted: e.target.checked })); setPage(1); }}
                className="rounded"
              />
              {t('products.onlyDiscounted')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.onlyShippable}
                onChange={(e) => { setFilters(prev => ({ ...prev, onlyShippable: e.target.checked })); setPage(1); }}
                className="rounded"
              />
              {t('products.onlyShippable')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.onlyPickup}
                onChange={(e) => { setFilters(prev => ({ ...prev, onlyPickup: e.target.checked })); setPage(1); }}
                className="rounded"
              />
              {t('products.onlyPickup')}
            </label>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg aspect-[3/4]" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">{t('products.noResults')}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {total} {t('products.perPage')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isInWishlist={wishlistIds.has(product.id)}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} /> {t('common.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                {t('common.next')} <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
