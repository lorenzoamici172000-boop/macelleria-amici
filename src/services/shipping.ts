import type { SupabaseClient } from '@supabase/supabase-js';
import type { ShippingRule } from '@/types';

export interface ShippingCheck {
  available: boolean;
  costCent: number;
  rule: ShippingRule | null;
  error?: string;
}

/**
 * Check if a ZIP code is served and get shipping cost.
 * Server-side only - never trust client-provided costs.
 */
export async function checkShippingForZip(
  supabase: SupabaseClient,
  zipCode: string
): Promise<ShippingCheck> {
  // Validate format
  if (!/^\d{5}$/.test(zipCode)) {
    return { available: false, costCent: 0, rule: null, error: 'CAP non valido (5 cifre)' };
  }

  const { data, error } = await supabase
    .from('shipping_rules')
    .select('*')
    .eq('zip_code', zipCode)
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return {
      available: false,
      costCent: 0,
      rule: null,
      error: 'Spedizione non disponibile per questo CAP',
    };
  }

  return {
    available: true,
    costCent: (data as ShippingRule).cost_cent,
    rule: data as ShippingRule,
  };
}

/**
 * Get all active shipping rules (admin)
 */
export async function getAllShippingRules(supabase: SupabaseClient): Promise<ShippingRule[]> {
  const { data } = await supabase
    .from('shipping_rules')
    .select('*')
    .order('zip_code', { ascending: true });

  return (data ?? []) as ShippingRule[];
}

/**
 * Validate that no duplicate active rules exist for the same ZIP
 */
export async function checkDuplicateZip(
  supabase: SupabaseClient,
  zipCode: string,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from('shipping_rules')
    .select('id')
    .eq('zip_code', zipCode)
    .eq('is_active', true);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

/**
 * Calculate complete order totals server-side.
 * This is the single source of truth for pricing.
 */
export function calculateOrderTotals(
  items: Array<{
    priceCent: number;
    discountPriceCent: number | null;
    quantity: number;
    vatRateBp: number;
  }>,
  shippingCostCent: number = 0
): {
  subtotalCent: number;
  vatTotalCent: number;
  shippingTotalCent: number;
  grandTotalCent: number;
  rows: Array<{
    rowTotalCent: number;
    rowVatCent: number;
    effectivePriceCent: number;
  }>;
} {
  let subtotalCent = 0;
  let vatTotalCent = 0;

  const rows = items.map((item) => {
    const effectivePriceCent = item.discountPriceCent ?? item.priceCent;
    const rowTotalCent = effectivePriceCent * item.quantity;
    // VAT from inclusive price: vat = total - (total * 10000 / (10000 + rate))
    const rowVatCent = rowTotalCent - Math.round((rowTotalCent * 10000) / (10000 + item.vatRateBp));

    subtotalCent += rowTotalCent;
    vatTotalCent += rowVatCent;

    return { rowTotalCent, rowVatCent, effectivePriceCent };
  });

  return {
    subtotalCent,
    vatTotalCent,
    shippingTotalCent: shippingCostCent,
    grandTotalCent: subtotalCent + shippingCostCent,
    rows,
  };
}
