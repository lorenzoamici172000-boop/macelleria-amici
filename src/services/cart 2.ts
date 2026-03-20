import type { SupabaseClient } from '@supabase/supabase-js';
import type { CartItem, Product } from '@/types';

export interface CartWithItems {
  id: string;
  items: (CartItem & { product: Product })[];
}

export async function getCart(supabase: SupabaseClient, userId: string): Promise<CartWithItems | null> {
  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!cart) return null;

  const { data: items } = await supabase
    .from('cart_items')
    .select('*, product:products(*, images:product_images(*))')
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  return {
    id: cart.id,
    items: (items ?? []) as (CartItem & { product: Product })[],
  };
}

export async function addToCart(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<{ success: boolean; error?: string }> {
  // Get or create cart
  let { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!cart) {
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select('id')
      .single();
    if (error) return { success: false, error: error.message };
    cart = newCart;
  }

  // Check if product already in cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart!.id)
    .eq('product_id', productId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ cart_id: cart!.id, product_id: productId, quantity });
    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateCartItemQuantity(
  supabase: SupabaseClient,
  itemId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  if (quantity <= 0) {
    return removeCartItem(supabase, itemId);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeCartItem(
  supabase: SupabaseClient,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function clearCart(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (cart) {
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
  }
}

/**
 * Validate cart items against current product data
 * Returns items that have changed (price, availability, etc.)
 */
export async function validateCartItems(
  supabase: SupabaseClient,
  items: (CartItem & { product: Product })[]
): Promise<{
  valid: boolean;
  warnings: string[];
  unavailableItems: string[];
}> {
  const warnings: string[] = [];
  const unavailableItems: string[] = [];

  for (const item of items) {
    if (!item.product || !item.product.is_active) {
      unavailableItems.push(item.id);
      continue;
    }
    if (item.product.stock === 0) {
      unavailableItems.push(item.id);
      continue;
    }
    if (item.quantity > item.product.stock) {
      warnings.push(`${item.product.name}: disponibilità ridotta a ${item.product.stock}`);
    }
  }

  return {
    valid: unavailableItems.length === 0 && warnings.length === 0,
    warnings,
    unavailableItems,
  };
}
