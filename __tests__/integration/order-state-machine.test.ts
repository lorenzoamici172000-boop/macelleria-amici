import { describe, it, expect } from 'vitest';
import { ORDER_STATUS_TRANSITIONS, ORDER_STATUS_LABELS_IT, ORDER_STATUS_LABELS_EN, PAYMENT_STATUS_LABELS_IT, PAYMENT_STATUS_LABELS_EN } from '@/types';
import type { OrderStatus, PaymentStatus } from '@/types';

describe('Order State Machine - Comprehensive', () => {
  describe('transition validation', () => {
    const allStatuses: OrderStatus[] = [
      'new', 'reserved', 'pending_payment', 'paid',
      'picked_up', 'preparing', 'completed', 'cancelled', 'failed',
    ];

    it('all statuses have transition definitions', () => {
      allStatuses.forEach(status => {
        expect(ORDER_STATUS_TRANSITIONS).toHaveProperty(status);
        expect(Array.isArray(ORDER_STATUS_TRANSITIONS[status])).toBe(true);
      });
    });

    it('no status can transition to itself', () => {
      allStatuses.forEach(status => {
        expect(ORDER_STATUS_TRANSITIONS[status]).not.toContain(status);
      });
    });

    it('completed and cancelled are terminal states', () => {
      expect(ORDER_STATUS_TRANSITIONS.completed).toEqual([]);
      expect(ORDER_STATUS_TRANSITIONS.cancelled).toEqual([]);
    });

    it('all transition targets are valid statuses', () => {
      allStatuses.forEach(status => {
        ORDER_STATUS_TRANSITIONS[status].forEach(target => {
          expect(allStatuses).toContain(target);
        });
      });
    });

    // Business rule: reservation cannot become paid online directly unless via webhook
    it('reservation flow: new → reserved → paid (via webhook)', () => {
      expect(ORDER_STATUS_TRANSITIONS.new).toContain('reserved');
      expect(ORDER_STATUS_TRANSITIONS.reserved).toContain('paid');
    });

    // Business rule: online payment flow
    it('online payment flow: new → pending_payment → paid', () => {
      expect(ORDER_STATUS_TRANSITIONS.new).toContain('pending_payment');
      expect(ORDER_STATUS_TRANSITIONS.pending_payment).toContain('paid');
    });

    // Business rule: paid can be picked up or completed
    it('paid → picked_up or completed', () => {
      expect(ORDER_STATUS_TRANSITIONS.paid).toContain('picked_up');
      expect(ORDER_STATUS_TRANSITIONS.paid).toContain('completed');
    });

    // Business rule: failed can retry (back to new)
    it('failed can go back to new', () => {
      expect(ORDER_STATUS_TRANSITIONS.failed).toContain('new');
    });

    // Business rule: cancellation is possible from early states
    it('cancellation is possible from new, reserved, pending_payment', () => {
      expect(ORDER_STATUS_TRANSITIONS.new).toContain('cancelled');
      expect(ORDER_STATUS_TRANSITIONS.reserved).toContain('cancelled');
      expect(ORDER_STATUS_TRANSITIONS.pending_payment).toContain('cancelled');
    });

    // Business rule: cannot cancel after payment
    it('cannot cancel after paid', () => {
      expect(ORDER_STATUS_TRANSITIONS.paid).not.toContain('cancelled');
      expect(ORDER_STATUS_TRANSITIONS.completed).not.toContain('cancelled');
    });
  });

  describe('italian labels completeness', () => {
    it('all order statuses have Italian labels', () => {
      const statuses: OrderStatus[] = [
        'new', 'reserved', 'pending_payment', 'paid',
        'picked_up', 'preparing', 'completed', 'cancelled', 'failed',
      ];

      statuses.forEach(status => {
        expect(ORDER_STATUS_LABELS_IT[status]).toBeTruthy();
        expect(typeof ORDER_STATUS_LABELS_IT[status]).toBe('string');
        expect(ORDER_STATUS_LABELS_IT[status].length).toBeGreaterThan(0);
      });
    });

    it('all payment statuses have Italian labels', () => {
      const statuses: PaymentStatus[] = [
        'not_required', 'pending', 'authorized', 'paid',
        'failed', 'canceled', 'refunded', 'partially_refunded', 'refund_failed_retry',
      ];

      statuses.forEach(status => {
        expect(PAYMENT_STATUS_LABELS_IT[status]).toBeTruthy();
        expect(typeof PAYMENT_STATUS_LABELS_IT[status]).toBe('string');
      });
    });
  });

  describe('english labels completeness', () => {
    it('all order statuses have English labels', () => {
      const statuses: OrderStatus[] = [
        'new', 'reserved', 'pending_payment', 'paid',
        'picked_up', 'preparing', 'completed', 'cancelled', 'failed',
      ];

      statuses.forEach(status => {
        expect(ORDER_STATUS_LABELS_EN[status]).toBeTruthy();
        expect(typeof ORDER_STATUS_LABELS_EN[status]).toBe('string');
      });
    });

    it('all payment statuses have English labels', () => {
      const statuses: PaymentStatus[] = [
        'not_required', 'pending', 'authorized', 'paid',
        'failed', 'canceled', 'refunded', 'partially_refunded', 'refund_failed_retry',
      ];

      statuses.forEach(status => {
        expect(PAYMENT_STATUS_LABELS_EN[status]).toBeTruthy();
        expect(typeof PAYMENT_STATUS_LABELS_EN[status]).toBe('string');
      });
    });
  });

  describe('label consistency between languages', () => {
    it('Italian and English labels cover the same statuses', () => {
      const itKeys = Object.keys(ORDER_STATUS_LABELS_IT).sort();
      const enKeys = Object.keys(ORDER_STATUS_LABELS_EN).sort();
      expect(itKeys).toEqual(enKeys);
    });

    it('Italian and English payment labels cover the same statuses', () => {
      const itKeys = Object.keys(PAYMENT_STATUS_LABELS_IT).sort();
      const enKeys = Object.keys(PAYMENT_STATUS_LABELS_EN).sort();
      expect(itKeys).toEqual(enKeys);
    });
  });
});
