'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';

/**
 * Cookie banner - uses sessionStorage (allowed for non-business UI state).
 * Shows only technical cookies notice since we use first-party analytics only.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { locale } = useLocale();

  useEffect(() => {
    // Check if already accepted this session
    try {
      const accepted = document.cookie.includes('cookie_consent=accepted');
      if (!accepted) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    // Set cookie for 1 year
    document.cookie = 'cookie_consent=accepted;path=/;max-age=31536000;samesite=lax';
    setVisible(false);
  };

  if (!visible) return null;

  const texts = {
    it: {
      message: 'Questo sito utilizza cookie tecnici necessari al funzionamento e cookie statistici first-party per migliorare il servizio.',
      accept: 'Accetto',
      more: 'Cookie Policy',
    },
    en: {
      message: 'This site uses technical cookies necessary for operation and first-party statistical cookies to improve the service.',
      accept: 'Accept',
      more: 'Cookie Policy',
    },
  };

  const t = texts[locale] || texts.it;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-gray-200 border-t border-gray-700 shadow-2xl animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm flex-1">
          {t.message}{' '}
          <Link href="/cookie-policy" className="underline hover:text-white">
            {t.more}
          </Link>
        </p>
        <button
          onClick={handleAccept}
          className="px-6 py-2 bg-white text-gray-900 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors shrink-0"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}
