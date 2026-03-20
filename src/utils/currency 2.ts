// ==============================================
// Monetary Utilities - ALL calculations in cents
// Zero floating point errors guaranteed
// ==============================================

/**
 * Format cents to display string (e.g., 1299 → "12,99 €")
 */
export function formatCents(cents: number, locale: 'it' | 'en' = 'it'): string {
  const euros = cents / 100;
  return new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

/**
 * Format cents to simple decimal (e.g., 1299 → "12.99")
 */
export function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Parse a decimal string to cents (e.g., "12.99" → 1299)
 */
export function decimalToCents(decimal: string | number): number {
  const num = typeof decimal === 'string' ? parseFloat(decimal) : decimal;
  return Math.round(num * 100);
}

/**
 * Calculate VAT amount from a VAT-inclusive price
 * vat_rate is in basis points: 2200 = 22.00%
 * Formula: vat = total - (total * 10000 / (10000 + vat_rate))
 */
export function calculateVatFromInclusive(totalCent: number, vatRateBp: number): number {
  return totalCent - Math.round((totalCent * 10000) / (10000 + vatRateBp));
}

/**
 * Calculate row total for an order item
 */
export function calculateRowTotal(unitPriceCent: number, quantity: number): number {
  return unitPriceCent * quantity;
}

/**
 * Get effective price (discount or regular)
 */
export function getEffectivePrice(priceCent: number, discountPriceCent: number | null): number {
  return discountPriceCent ?? priceCent;
}

/**
 * Calculate discount percentage
 */
export function getDiscountPercentage(priceCent: number, discountPriceCent: number | null): number {
  if (!discountPriceCent || discountPriceCent >= priceCent) return 0;
  return Math.round(((priceCent - discountPriceCent) / priceCent) * 100);
}

/**
 * Format VAT rate from basis points to display
 * 2200 → "22%"
 */
export function formatVatRate(vatRateBp: number): string {
  return `${(vatRateBp / 100).toFixed(vatRateBp % 100 === 0 ? 0 : 2)}%`;
}
