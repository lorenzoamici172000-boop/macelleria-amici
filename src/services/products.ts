import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product, ProductFilters, PaginationParams, Category } from '@/types';

interface ProductsResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getProducts(
  supabase: SupabaseClient,
  filters: ProductFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 10 }
): Promise<ProductsResult> {
  let query = supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)', { count: 'exact' })
    .eq('is_active', true);

  // Search
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term}`);
  }

  // Category filter
  if (filters.category) {
    query = query.eq('category_id', filters.category);
  }

  // Available only
  if (filters.onlyAvailable) {
    query = query.gt('stock', 0);
  }

  // Price range
  if (filters.minPrice !== undefined) {
    query = query.gte('price_cent', filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price_cent', filters.maxPrice);
  }

  // Discounted only
  if (filters.onlyDiscounted) {
    query = query.not('discount_price_cent', 'is', null);
  }

  // Shippable
  if (filters.onlyShippable) {
    query = query.eq('shipping_enabled', true);
  }

  // Pickup only
  if (filters.onlyPickup) {
    query = query.eq('pickup_enabled', true);
  }

  // Sorting
  switch (filters.sortBy) {
    case 'price_asc':
      query = query.order('price_cent', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_cent', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'discount_desc':
      query = query.order('discount_price_cent', { ascending: true, nullsFirst: false });
      break;
    case 'available_first':
      query = query.order('stock', { ascending: false });
      break;
    case 'name_asc':
    default:
      query = query.order('name', { ascending: true });
      break;
  }

  // Pagination
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching products:', error);
    return { products: [], total: 0, page: pagination.page, pageSize: pagination.pageSize, totalPages: 0 };
  }

  const total = count ?? 0;

  return {
    products: (data ?? []) as Product[],
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(total / pagination.pageSize),
  };
}

export async function getProductBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as Product;
}

export async function getProductById(
  supabase: SupabaseClient,
  id: string
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Product;
}

export async function getCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) return [];
  return (data ?? []) as Category[];
}

export async function getOutOfStockProducts(supabase: SupabaseClient): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('stock', 0)
    .order('name');

  return (data ?? []) as Product[];
}

export async function getLowStockProducts(supabase: SupabaseClient, threshold: number = 5): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .gt('stock', 0)
    .lte('stock', threshold)
    .order('stock', { ascending: true });

  return (data ?? []) as Product[];
}

// ---- Admin CRUD ----

export async function createProduct(
  supabase: SupabaseClient,
  product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images'>
): Promise<{ data: Product | null; error: string | null }> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Product, error: null };
}

export async function updateProduct(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Product>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function createCategory(
  supabase: SupabaseClient,
  category: { name: string; slug: string; description?: string; display_order?: number }
): Promise<{ data: Category | null; error: string | null }> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Category, error: null };
}
