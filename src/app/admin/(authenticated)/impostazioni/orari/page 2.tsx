'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getBusinessSettings, updateBusinessSettings } from '@/services/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BusinessSettings, OpeningHour } from '@/types';
import { revalidatePublicPages } from '@/utils/revalidate';

const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function AdminOrariPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getBusinessSettings(supabase).then(data => { setSettings(data); setIsLoading(false); });
  }, [supabase]);

  const hours = settings?.opening_hours ?? [];

  const updateHour = (day: number, index: number, field: keyof OpeningHour, value: string | boolean) => {
    if (!settings) return;
    const newHours = [...hours];
    const dayHours = newHours.filter(h => h.day === day);
    const target = dayHours[index];
    if (target) {
      const mainIndex = newHours.indexOf(target);
      newHours[mainIndex] = { ...target, [field]: value };
      setSettings({ ...settings, opening_hours: newHours });
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true); setSaved(false);
    await updateBusinessSettings(supabase, {
      opening_hours: settings.opening_hours,
      pickup_slots: settings.pickup_slots,
      extraordinary_closures: settings.extraordinary_closures,
    });
    setIsSaving(false); setSaved(true);
    revalidatePublicPages();
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading || !settings) return (
    <div className="animate-pulse h-64 bg-gray-200 rounded max-w-2xl" />
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orari e Ritiro</h1>
        <Button onClick={handleSave} isLoading={isSaving} className="bg-gray-900 text-white hover:bg-gray-800">Salva</Button>
      </div>
      {saved && <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">Salvato</div>}

      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-semibold mb-4">Orari di apertura</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
            const dayHours = hours.filter(h => h.day === dayNum);
            const dayName = DAYS[dayNum] ?? '';
            return (
              <div key={dayNum} className="flex items-center gap-3 text-sm">
                <span className="w-24 font-medium shrink-0">{dayName}</span>
                {dayHours.length === 0 ? (
                  <span className="text-gray-400">Non configurato</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dayHours.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={h.closed}
                            onChange={(e) => updateHour(dayNum, idx, 'closed', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs">Chiuso</span>
                        </label>
                        {!h.closed && (
                          <>
                            <Input
                              type="time"
                              value={h.open}
                              onChange={(e) => updateHour(dayNum, idx, 'open', e.target.value)}
                              className="w-28 h-8 text-xs"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={h.close}
                              onChange={(e) => updateHour(dayNum, idx, 'close', e.target.value)}
                              className="w-28 h-8 text-xs"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Per aggiungere o rimuovere fasce orarie, modificare direttamente il JSON in Supabase o estendere questa UI.
        </p>
      </div>
    </div>
  );
}
