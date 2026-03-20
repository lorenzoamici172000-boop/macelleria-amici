import { describe, it, expect } from 'vitest';
import { ORDER_STATUS_TRANSITIONS } from '@/types';
import { getReservationAge, generateWhatsAppLink, getOrderStatusColor } from '@/utils/helpers';

describe('Order State Machine', () => {
  it('new can transition to reserved, pending_payment, cancelled, failed', () => {
    expect(ORDER_STATUS_TRANSITIONS.new).toEqual(['reserved', 'pending_payment', 'cancelled', 'failed']);
  });

  it('reserved can transition to pending_payment, paid, picked_up, preparing, cancelled', () => {
    expect(ORDER_STATUS_TRANSITIONS.reserved).toContain('paid');
    expect(ORDER_STATUS_TRANSITIONS.reserved).toContain('cancelled');
    expect(ORDER_STATUS_TRANSITIONS.reserved).toContain('picked_up');
  });

  it('paid can transition to preparing, picked_up, completed', () => {
    expect(ORDER_STATUS_TRANSITIONS.paid).toEqual(['preparing', 'picked_up', 'completed']);
  });

  it('completed has no transitions', () => {
    expect(ORDER_STATUS_TRANSITIONS.completed).toEqual([]);
  });

  it('cancelled has no transitions', () => {
    expect(ORDER_STATUS_TRANSITIONS.cancelled).toEqual([]);
  });

  it('invalid transition is not in list', () => {
    expect(ORDER_STATUS_TRANSITIONS.new).not.toContain('completed');
    expect(ORDER_STATUS_TRANSITIONS.pending_payment).not.toContain('completed');
  });
});

describe('Helpers', () => {
  describe('getReservationAge', () => {
    it('returns new for recent dates', () => {
      const now = new Date().toISOString();
      expect(getReservationAge(now)).toBe('new');
    });

    it('returns old for 10 days ago', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      expect(getReservationAge(tenDaysAgo)).toBe('old');
    });

    it('returns very_old for 35 days ago', () => {
      const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
      expect(getReservationAge(thirtyFiveDaysAgo)).toBe('very_old');
    });
  });

  describe('generateWhatsAppLink', () => {
    it('generates correct link with Italian number', () => {
      expect(generateWhatsAppLink('3757059237')).toBe('https://wa.me/393757059237');
    });

    it('handles number with country code', () => {
      expect(generateWhatsAppLink('393757059237')).toBe('https://wa.me/393757059237');
    });

    it('strips non-digit characters', () => {
      expect(generateWhatsAppLink('+39 375 705 9237')).toBe('https://wa.me/393757059237');
    });
  });

  describe('getOrderStatusColor', () => {
    it('returns appropriate colors', () => {
      expect(getOrderStatusColor('paid')).toContain('green');
      expect(getOrderStatusColor('failed')).toContain('red');
      expect(getOrderStatusColor('cancelled')).toContain('gray');
      expect(getOrderStatusColor('new')).toContain('blue');
    });

    it('handles unknown status gracefully', () => {
      expect(getOrderStatusColor('unknown')).toContain('gray');
    });
  });
});
