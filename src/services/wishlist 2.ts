import type { SupabaseClient } from '@supabase/supabase-js';
import type { WishlistItem, Product } from '@/types';

export async function getWishlistItems(
  supabase: SupabaseClient,
  userId: string
): Promise<(WishlistItem & { product: Product })[]> {
  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!wishlist) return [];

  const { data } = await supabase
    .from('wishlist_items')
    .select('*, product:products(*, images:product_images(*))')
    .eq('wishlist_id', wishlist.id)
    .order('created_at', { ascending: false });

  return (data ?? []) as (WishlistItem & { product: Product })[];
}

export async function addToWishlist(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  let { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!wishlist) {
    const { data: newWishlist, error } = await supabase
      .from('wishlists')
      .insert({ user_id: userId })
      .select('id')
      .single();
    if (error) return { success: false, error: error.message };
    wishlist = newWishlist;
  }

  const { error } = await supabase
    .from('wishlist_items')
    .insert({ wishlist_id: wishlist!.id, product_id: productId });

  if (error) {
    if (error.code === '23505') return { success: true }; // Already exists
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function removeFromWishlist(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!wishlist) return { success: true };

  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('wishlist_id', wishlist.id)
    .eq('product_id', productId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function isInWishlist(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<boolean> {
  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!wishlist) return false;

  const { data } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('wishlist_id', wishlist.id)
    .eq('product_id', productId)
    .single();

  return !!data;
}
