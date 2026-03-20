'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';
import { useLocale } from '@/hooks/useLocale';
import { useAnalytics } from '@/hooks/useAnalytics';

export function HeroSection() {
  const { settings } = useTheme();
  const { t } = useLocale();
  const { trackHeroCta } = useAnalytics();

  const heroImage = settings.hero_image_url;
  const btnText = settings.hero_button_text || t('hero.cta');
  const btnLink = settings.hero_button_link || '/prodotti';

  return (
    <section className="relative w-full h-[60vh] min-h-[400px] max-h-[700px] overflow-hidden bg-gray-900">
      {/* Background Image */}
      {heroImage ? (
        <Image
          src={heroImage}
          alt="Hero"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
        <Link
          href={btnLink}
          onClick={trackHeroCta}
          className="inline-flex items-center self-start font-display text-lg transition-all hover:scale-105 hover:shadow-lg"
          style={{
            backgroundColor: settings.hero_btn_bg || settings.color_primary,
            color: settings.hero_btn_text || settings.color_primary_foreground,
            border: `1px solid ${settings.hero_btn_border || settings.color_primary_foreground}`,
            borderRadius: settings.hero_btn_radius || '0.5rem',
            padding: settings.button_padding || '0.75rem 1.5rem',
            fontSize: settings.hero_btn_font_size || '1.125rem',
            fontFamily: 'var(--font-display)',
          }}
        >
          {btnText}
        </Link>
      </div>
    </section>
  );
}
