'use client';

import { MapPin, Phone, MessageCircle, Clock } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import type { BusinessSettings } from '@/types';
import { generateWhatsAppLink } from '@/utils/helpers';

interface ContactsContentProps {
  business: BusinessSettings;
}

export function ContactsContent({ business }: ContactsContentProps) {
  const { t } = useLocale();
  const { settings } = useTheme();

  const dayNames = [
    t('day.0'), t('day.1'), t('day.2'), t('day.3'),
    t('day.4'), t('day.5'), t('day.6'),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl md:text-4xl mb-8"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {t('contacts.title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Info */}
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl mb-3" style={{ color: settings.color_primary }}>
              {business.business_name}
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="shrink-0 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t('contacts.operationalAddress')}</p>
                <p className="text-sm text-muted-foreground">{business.operational_address}</p>
              </div>
            </div>

            {business.legal_address && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="shrink-0 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('contacts.legalAddress')}</p>
                  <p className="text-sm text-muted-foreground">{business.legal_address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Phone size={18} className="shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t('contacts.phone')}</p>
                <a href={`tel:${business.phone}`} className="text-sm text-muted-foreground hover:underline">
                  {business.phone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MessageCircle size={18} className="shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t('contacts.whatsapp')}</p>
                <a
                  href={generateWhatsAppLink(business.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-1 px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 transition-colors"
                >
                  <MessageCircle size={16} />
                  {t('contacts.whatsappCta')}
                </a>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          {business.opening_hours && business.opening_hours.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 font-medium mb-3">
                <Clock size={18} /> {t('contacts.openingHours')}
              </h3>
              <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                  const dayHours = business.opening_hours.filter(h => h.day === dayNum);
                  const dayName = dayNames[dayNum] ?? '';
                  return (
                    <div key={dayNum} className="flex justify-between text-sm">
                      <span className="font-medium w-24">{dayName}</span>
                      <span className="text-muted-foreground">
                        {dayHours.length === 0 || dayHours.every(h => h.closed)
                          ? t('contacts.closed')
                          : dayHours
                              .filter(h => !h.closed)
                              .map(h => `${h.open} - ${h.close}`)
                              .join(' / ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="space-y-4">
          {business.google_maps_embed_url ? (
            <iframe
              src={business.google_maps_embed_url}
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '0.5rem' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mappa"
            />
          ) : (
            <div className="w-full h-[400px] rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin size={32} className="mx-auto mb-2" />
                <p className="text-sm">{business.operational_address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
