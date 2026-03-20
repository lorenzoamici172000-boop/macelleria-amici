'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getBusinessSettings, updateBusinessSettings, DEFAULT_BUSINESS_SETTINGS } from '@/services/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { revalidateSettings } from '@/utils/revalidate';
import type { BusinessSettings } from '@/types';

export default function AdminAttivitaPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_BUSINESS_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await getBusinessSettings(supabase);
      setSettings(data);
      setIsLoading(false);
    };
    load();
  }, [supabase]);

  const handleChange = (key: keyof BusinessSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(''); setSaved(false);
    const result = await updateBusinessSettings(supabase, {
      business_name: settings.business_name,
      operational_address: settings.operational_address,
      legal_address: settings.legal_address,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      email: settings.email,
      website: settings.website,
      google_maps_embed_url: settings.google_maps_embed_url,
      facebook_url: settings.facebook_url,
      instagram_url: settings.instagram_url,
    });
    if (result.success) {
      setSaved(true);
      try { revalidateSettings(); } catch {}
    } else {
      setError(result.error || 'Errore');
    }
    setIsSaving(false);
  };

  if (isLoading) return (
    <div className="animate-pulse h-64 bg-gray-200 rounded" />
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dati Attività</h1>
        <Button onClick={handleSave} isLoading={isSaving} className="bg-gray-900 text-white hover:bg-gray-800">
          Salva
        </Button>
      </div>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {saved && <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">Salvato correttamente</div>}

      <div className="bg-white rounded-lg border p-6 space-y-4">
        {([
          ['business_name', 'Nome attività'],
          ['operational_address', 'Sede operativa'],
          ['legal_address', 'Sede legale'],
          ['phone', 'Telefono fisso'],
          ['whatsapp', 'WhatsApp'],
          ['email', 'Email'],
          ['website', 'Sito web'],
          ['google_maps_embed_url', 'URL embed Google Maps'],
          ['facebook_url', 'Facebook URL'],
          ['instagram_url', 'Instagram URL'],
        ] as const).map(([key, label]) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <Input
              value={(settings[key] as string) || ''}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
