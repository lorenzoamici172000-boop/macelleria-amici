'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalytics } from '@/hooks/useAnalytics';

/**
 * Tracks page views on route changes.
 * Placed in the public layout to track all public pages.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const { trackPageView } = useAnalytics();
  const lastPathRef = useRef('');

  useEffect(() => {
    // Only track if pathname actually changed
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      trackPageView();
    }
  }, [pathname, trackPageView]);

  return null; // Invisible component
}
