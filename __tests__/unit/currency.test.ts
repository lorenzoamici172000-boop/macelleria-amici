import { describe, it, expect } from 'vitest';
import {
  formatCents,
  centsToDecimal,
  decimalToCents,
  calculateVatFromInclusive,
  calculateRowTotal,
  getEffectivePrice,
  getDiscountPercentage,
  formatVatRate,
} from '@/utils/currency';

describe('Currency Utilities', () => {
  describe('formatCents', () => {
    it('formats cents to EUR string', () => {
      expect(formatCents(1299, 'it')).toContain('12,99');
      expect(formatCents(0, 'it')).toContain('0,00');
      expect(formatCents(100, 'it')).toContain('1,00');
    });

    it('handles large amounts', () => {
      expect(formatCents(999999, 'it')).toContain('9.999,99');
    });
  });

  describe('centsToDecimal', () => {
    it('converts cents to decimal string', () => {
      expect(centsToDecimal(1299)).toBe('12.99');
      expect(centsToDecimal(100)).toBe('1.00');
      expect(centsToDecimal(0)).toBe('0.00');
    });
  });

  describe('decimalToCents', () => {
    it('converts decimal to cents', () => {
      expect(decimalToCents('12.99')).toBe(1299);
      expect(decimalToCents('1.00')).toBe(100);
      expect(decimalToCents('0.01')).toBe(1);
      expect(decimalToCents(12.99)).toBe(1299);
    });

    it('handles floating point edge cases', () => {
      expect(decimalToCents('0.1')).toBe(10);
      expect(decimalToCents('0.2')).toBe(20);
      // 0.1 + 0.2 in float = 0.30000000000000004, but with Math.round it's fine
      expect(decimalToCents(0.3)).toBe(30);
    });
  });

  describe('calculateVatFromInclusive', () => {
    it('calculates VAT from inclusive price (22%)', () => {
      // 10.00 EUR inclusive of 22% VAT
      // Net = 10.00 / 1.22 = 8.1967...
      // VAT = 10.00 - 8.20 = 1.80
      const vat = calculateVatFromInclusive(1000, 2200);
      expect(vat).toBe(180); // 1.80 EUR
    });

    it('calculates VAT for 10% rate', () => {
      const vat = calculateVatFromInclusive(1100, 1000);
      expect(vat).toBe(100); // 1.00 EUR
    });

    it('handles 4% rate', () => {
      const vat = calculateVatFromInclusive(1040, 400);
      expect(vat).toBe(40); // 0.40 EUR
    });

    it('handles zero VAT', () => {
      const vat = calculateVatFromInclusive(1000, 0);
      expect(vat).toBe(0);
    });
  });

  describe('calculateRowTotal', () => {
    it('multiplies price by quantity', () => {
      expect(calculateRowTotal(500, 3)).toBe(1500);
      expect(calculateRowTotal(1299, 1)).toBe(1299);
      expect(calculateRowTotal(100, 10)).toBe(1000);
    });
  });

  describe('getEffectivePrice', () => {
    it('returns discount price when available', () => {
      expect(getEffectivePrice(1000, 800)).toBe(800);
    });

    it('returns regular price when no discount', () => {
      expect(getEffectivePrice(1000, null)).toBe(1000);
    });
  });

  describe('getDiscountPercentage', () => {
    it('calculates discount percentage', () => {
      expect(getDiscountPercentage(1000, 800)).toBe(20);
      expect(getDiscountPercentage(1000, 500)).toBe(50);
      expect(getDiscountPercentage(1000, 750)).toBe(25);
    });

    it('returns 0 when no discount', () => {
      expect(getDiscountPercentage(1000, null)).toBe(0);
      expect(getDiscountPercentage(1000, 1000)).toBe(0);
      expect(getDiscountPercentage(1000, 1200)).toBe(0);
    });
  });

  describe('formatVatRate', () => {
    it('formats basis points to percentage', () => {
      expect(formatVatRate(2200)).toBe('22%');
      expect(formatVatRate(1000)).toBe('10%');
      expect(formatVatRate(400)).toBe('4%');
      expect(formatVatRate(0)).toBe('0%');
    });
  });
});
