'use client';

import { useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AnalyticsEvent } from '@/types';

/**
 * Client-side analytics tracking hook.
 * Sends events to Supabase via the API route.
 * Never blocks UI or throws errors.
 */
export function useAnalytics() {
  const { user, isAdmin } = useAuth();
  const sessionIdRef = useRef<string>('');

  // Generate a session ID once per tab
  useEffect(() => {
    sessionIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }, []);

  const getSourceType = useCallback((): string => {
    if (typeof window === 'undefined') return 'direct';
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    if (utmSource) {
      if (utmSource.includes('whatsapp')) return 'whatsapp';
      if (utmSource.includes('facebook') || utmSource.includes('fb')) return 'facebook';
      if (utmSource.includes('instagram') || utmSource.includes('ig')) return 'instagram';
      return 'referrer';
    }
    const referrer = document.referrer;
    if (referrer.includes('whatsapp')) return 'whatsapp';
    if (referrer.includes('facebook') || referrer.includes('fb.com')) return 'facebook';
    if (referrer.includes('instagram')) return 'instagram';
    if (referrer && !referrer.includes(window.location.hostname)) return 'referrer';
    return 'direct';
  }, []);

  const track = useCallback(async (
    eventName: string,
    extra?: Partial<AnalyticsEvent>
  ) => {
    try {
      // Don't track admin traffic
      if (isAdmin) return;

      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName,
          page_path: typeof window !== 'undefined' ? window.location.pathname : '',
          referrer: typeof document !== 'undefined' ? document.referrer : '',
          source_type: getSourceType(),
          user_id: user?.id ?? null,
          session_id: sessionIdRef.current,
          ...extra,
        }),
      });
    } catch {
      // Analytics should never break the app
    }
  }, [user, isAdmin, getSourceType]);

  const trackPageView = useCallback(() => {
    track('page_view');
  }, [track]);

  const trackProductView = useCallback((productId: string) => {
    track('product_view', { product_id: productId });
  }, [track]);

  const trackCartAdd = useCallback((productId: string) => {
    track('cart_add', { product_id: productId });
  }, [track]);

  const trackCheckoutStart = useCallback(() => {
    track('checkout_start');
  }, [track]);

  const trackCheckoutComplete = useCallback(() => {
    track('checkout_complete');
  }, [track]);

  const trackWhatsAppClick = useCallback(() => {
    track('whatsapp_click');
  }, [track]);

  const trackHeroCta = useCallback(() => {
    track('hero_cta_click');
  }, [track]);

  const trackReviewsCta = useCallback(() => {
    track('reviews_cta_click');
  }, [track]);

  const trackSocialClick = useCallback((platform: 'facebook' | 'instagram') => {
    track(`${platform}_click`);
  }, [track]);

  return {
    track,
    trackPageView,
    trackProductView,
    trackCartAdd,
    trackCheckoutStart,
    trackCheckoutComplete,
    trackWhatsAppClick,
    trackHeroCta,
    trackReviewsCta,
    trackSocialClick,
  };
}
