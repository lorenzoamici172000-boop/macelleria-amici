import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, ShippingAddress, BillingAddress, InvoiceProfile } from '@/types';

export async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data as Profile | null;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<Pick<Profile, 'first_name' | 'last_name' | 'phone'>>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function checkUsernameAvailability(
  supabase: SupabaseClient,
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('username_lower', username.toLowerCase());

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data } = await query.single();
  return !data; // true = available
}

export async function getShippingAddress(
  supabase: SupabaseClient,
  userId: string
): Promise<ShippingAddress | null> {
  const { data } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data as ShippingAddress | null;
}

export async function upsertShippingAddress(
  supabase: SupabaseClient,
  userId: string,
  address: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('shipping_addresses')
    .upsert({ ...address, user_id: userId }, { onConflict: 'user_id' });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getBillingAddress(
  supabase: SupabaseClient,
  userId: string
): Promise<BillingAddress | null> {
  const { data } = await supabase
    .from('billing_addresses')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data as BillingAddress | null;
}

export async function upsertBillingAddress(
  supabase: SupabaseClient,
  userId: string,
  address: Omit<BillingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('billing_addresses')
    .upsert({ ...address, user_id: userId }, { onConflict: 'user_id' });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getInvoiceProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<InvoiceProfile | null> {
  const { data } = await supabase
    .from('invoice_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data as InvoiceProfile | null;
}

export async function upsertInvoiceProfile(
  supabase: SupabaseClient,
  userId: string,
  profile: Omit<InvoiceProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('invoice_profiles')
    .upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Get complete user data for checkout pre-fill
 */
export async function getCheckoutUserData(supabase: SupabaseClient, userId: string) {
  const [profile, shipping, billing, invoice] = await Promise.all([
    getProfile(supabase, userId),
    getShippingAddress(supabase, userId),
    getBillingAddress(supabase, userId),
    getInvoiceProfile(supabase, userId),
  ]);

  return { profile, shipping, billing, invoice };
}
