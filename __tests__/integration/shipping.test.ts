import { describe, it, expect } from 'vitest';
import { calculateOrderTotals } from '@/services/shipping';

describe('Shipping & Order Totals', () => {
  describe('calculateOrderTotals', () => {
    it('calculates correct totals for single item', () => {
      const result = calculateOrderTotals([
        { priceCent: 1000, discountPriceCent: null, quantity: 1, vatRateBp: 2200 },
      ]);

      expect(result.subtotalCent).toBe(1000);
      expect(result.shippingTotalCent).toBe(0);
      expect(result.grandTotalCent).toBe(1000);
      // VAT from 10.00 at 22% inclusive ≈ 1.80
      expect(result.vatTotalCent).toBe(180);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]!.effectivePriceCent).toBe(1000);
    });

    it('calculates correct totals for multiple items', () => {
      const result = calculateOrderTotals([
        { priceCent: 1000, discountPriceCent: null, quantity: 2, vatRateBp: 2200 },
        { priceCent: 500, discountPriceCent: 400, quantity: 3, vatRateBp: 1000 },
      ]);

      // Item 1: 1000 * 2 = 2000
      // Item 2: 400 * 3 = 1200 (discount applied)
      expect(result.subtotalCent).toBe(3200);
      expect(result.rows[0]!.rowTotalCent).toBe(2000);
      expect(result.rows[1]!.rowTotalCent).toBe(1200);
      expect(result.rows[1]!.effectivePriceCent).toBe(400);
    });

    it('applies discount price when available', () => {
      const result = calculateOrderTotals([
        { priceCent: 1000, discountPriceCent: 800, quantity: 1, vatRateBp: 2200 },
      ]);

      expect(result.subtotalCent).toBe(800);
      expect(result.rows[0]!.effectivePriceCent).toBe(800);
    });

    it('adds shipping cost to grand total', () => {
      const result = calculateOrderTotals(
        [{ priceCent: 1000, discountPriceCent: null, quantity: 1, vatRateBp: 2200 }],
        500 // 5.00 EUR shipping
      );

      expect(result.subtotalCent).toBe(1000);
      expect(result.shippingTotalCent).toBe(500);
      expect(result.grandTotalCent).toBe(1500);
    });

    it('handles zero shipping', () => {
      const result = calculateOrderTotals(
        [{ priceCent: 1000, discountPriceCent: null, quantity: 1, vatRateBp: 2200 }],
        0
      );

      expect(result.grandTotalCent).toBe(1000);
    });

    it('calculates VAT correctly for different rates', () => {
      const result = calculateOrderTotals([
        { priceCent: 10000, discountPriceCent: null, quantity: 1, vatRateBp: 2200 }, // 22%
        { priceCent: 10000, discountPriceCent: null, quantity: 1, vatRateBp: 1000 }, // 10%
        { priceCent: 10000, discountPriceCent: null, quantity: 1, vatRateBp: 400 },  // 4%
      ]);

      // 100 EUR at 22% → VAT ≈ 18.03
      // 100 EUR at 10% → VAT ≈ 9.09
      // 100 EUR at 4%  → VAT ≈ 3.85
      expect(result.rows[0]!.rowVatCent).toBe(1803);
      expect(result.rows[1]!.rowVatCent).toBe(909);
      expect(result.rows[2]!.rowVatCent).toBe(385);
      expect(result.vatTotalCent).toBe(1803 + 909 + 385);
    });

    it('handles empty items array', () => {
      const result = calculateOrderTotals([]);

      expect(result.subtotalCent).toBe(0);
      expect(result.vatTotalCent).toBe(0);
      expect(result.grandTotalCent).toBe(0);
      expect(result.rows).toHaveLength(0);
    });

    it('handles quantity greater than 1', () => {
      const result = calculateOrderTotals([
        { priceCent: 599, discountPriceCent: null, quantity: 5, vatRateBp: 2200 },
      ]);

      expect(result.subtotalCent).toBe(2995); // 599 * 5
      expect(result.rows[0]!.rowTotalCent).toBe(2995);
    });

    it('all calculations use integers only (no floating point)', () => {
      const result = calculateOrderTotals([
        { priceCent: 333, discountPriceCent: null, quantity: 3, vatRateBp: 2200 },
      ], 199);

      // All values should be integers
      expect(Number.isInteger(result.subtotalCent)).toBe(true);
      expect(Number.isInteger(result.vatTotalCent)).toBe(true);
      expect(Number.isInteger(result.shippingTotalCent)).toBe(true);
      expect(Number.isInteger(result.grandTotalCent)).toBe(true);
      result.rows.forEach(row => {
        expect(Number.isInteger(row.rowTotalCent)).toBe(true);
        expect(Number.isInteger(row.rowVatCent)).toBe(true);
      });
    });
  });
});
