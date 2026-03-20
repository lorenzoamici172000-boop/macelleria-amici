'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';

export default function ConfermaPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order') || searchParams.get('session_id');
  const { t } = useLocale();
  const { settings } = useTheme();

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
        <CheckCircle size={40} className="text-green-600" />
      </div>
      <h1
        className="text-3xl mb-4"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {t('confirmation.title')}
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        {t('confirmation.thankYou')}
        <br />
        {t('confirmation.details')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/i-miei-ordini">
          <Button
            style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}
          >
            {t('confirmation.goToOrders')}
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline">{t('confirmation.goHome')}</Button>
        </Link>
      </div>
    </div>
  );
}
