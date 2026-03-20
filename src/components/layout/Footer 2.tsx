'use client';

import Link from 'next/link';
import { Phone, MapPin, MessageCircle } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import type { BusinessSettings } from '@/types';
import { generateWhatsAppLink } from '@/utils/helpers';

interface FooterProps {
  business: BusinessSettings;
}

export function Footer({ business }: FooterProps) {
  const { t } = useLocale();
  const { settings } = useTheme();

  const whatsappLink = generateWhatsAppLink(business.whatsapp || '3757059237');
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t"
      style={{ backgroundColor: settings.color_footer_bg, color: settings.color_footer_text }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3
              className="text-xl mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {business.business_name || 'Macelleria Amici'}
            </h3>
            <div className="space-y-2 text-sm opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="shrink-0 mt-0.5" />
                <span>{business.operational_address || 'Via Luigi Capuana 6A, Roma'}</span>
              </div>
              {business.legal_address && (
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="shrink-0 mt-0.5" />
                  <span>{business.legal_address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Phone size={16} className="shrink-0" />
                <a href={`tel:${business.phone}`} className="hover:underline">
                  {business.phone || '06 64505881'}
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider opacity-60">Link utili</h4>
            <div className="space-y-2 text-sm">
              <Link href="/prodotti" className="block opacity-80 hover:opacity-100 transition-opacity">
                {t('nav.products')}
              </Link>
              <Link href="/chi-siamo" className="block opacity-80 hover:opacity-100 transition-opacity">
                {t('nav.about')}
              </Link>
              <Link href="/contatti" className="block opacity-80 hover:opacity-100 transition-opacity">
                {t('nav.contacts')}
              </Link>
              <Link href="/privacy-policy" className="block opacity-80 hover:opacity-100 transition-opacity">
                {t('footer.privacy')}
              </Link>
              <Link href="/cookie-policy" className="block opacity-80 hover:opacity-100 transition-opacity">
                {t('footer.cookie')}
              </Link>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div>
            <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider opacity-60">WhatsApp</h4>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-green-600 text-white text-sm font-medium transition-colors hover:bg-green-700"
            >
              <MessageCircle size={18} />
              {t('whatsapp.cta')}
            </a>
            <p className="mt-2 text-xs opacity-60">
              {business.whatsapp || '375 705 9237'}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t text-center text-xs opacity-50" style={{ borderColor: settings.color_footer_text + '20' }}>
          © {currentYear} {business.business_name || 'Macelleria Amici'}. {t('footer.rights')}.
        </div>
      </div>
    </footer>
  );
}
