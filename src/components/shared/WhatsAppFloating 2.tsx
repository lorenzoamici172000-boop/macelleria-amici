'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useLocale } from '@/hooks/useLocale';
import { useAnalytics } from '@/hooks/useAnalytics';
import { generateWhatsAppLink } from '@/utils/helpers';

interface WhatsAppFloatingProps {
  whatsappNumber: string;
}

export function WhatsAppFloating({ whatsappNumber }: WhatsAppFloatingProps) {
  // Session-only state: hidden until tab closes. No localStorage used.
  const [dismissed, setDismissed] = useState(false);
  const { settings } = useTheme();
  const { t } = useLocale();
  const { trackWhatsAppClick } = useAnalytics();

  if (!settings.whatsapp_floating_enabled || dismissed) return null;

  const link = generateWhatsAppLink(whatsappNumber);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-2 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl p-3 max-w-[200px] text-sm text-gray-800 border">
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 hover:bg-gray-200 transition-colors"
          aria-label="Chiudi"
        >
          <X size={12} />
        </button>
        <p className="font-medium">{t('whatsapp.cta')}</p>
      </div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackWhatsAppClick}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors hover:scale-105"
        aria-label="WhatsApp"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
