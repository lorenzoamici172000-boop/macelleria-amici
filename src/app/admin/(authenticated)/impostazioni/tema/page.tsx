'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSiteSettings, updateSiteSettings, DEFAULT_SITE_SETTINGS } from '@/services/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { revalidateSettings } from '@/utils/revalidate';
import type { SiteSettings } from '@/types';

const COLOR_FIELDS: { key: keyof SiteSettings; label: string }[] = [
  { key: 'color_primary', label: 'Colore primario' },
  { key: 'color_primary_foreground', label: 'Testo primario' },
  { key: 'color_navbar_bg', label: 'Sfondo Navbar' },
  { key: 'color_navbar_text', label: 'Testo Navbar' },
  { key: 'color_footer_bg', label: 'Sfondo Footer' },
  { key: 'color_footer_text', label: 'Testo Footer' },
  { key: 'color_secondary', label: 'Colore secondario' },
  { key: 'color_accent', label: 'Colore accento' },
  { key: 'color_background', label: 'Sfondo pagina' },
  { key: 'color_foreground', label: 'Testo pagina' },
  { key: 'color_muted', label: 'Sfondo muted' },
  { key: 'color_border', label: 'Bordi' },
];

export default function AdminTemaPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await getSiteSettings(supabase);
      setSettings(data);
      setIsLoading(false);
    };
    load();
  }, [supabase]);

  const handleChange = (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaved(false);

    const result = await updateSiteSettings(supabase, settings);
    if (result.success) {
      setSaved(true);
      revalidateSettings();
    } else {
      setError(result.error || 'Errore nel salvataggio');
    }
    setIsSaving(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SITE_SETTINGS);
    setSaved(false);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tema Globale</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>Reset default</Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Salva tema
          </Button>
        </div>
      </div>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {saved && <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">Tema salvato correttamente</div>}

      {/* Colors */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Colori</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                value={(settings[key] as string) || '#000000'}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <div className="flex-1">
                <label className="text-sm font-medium">{label}</label>
                <Input
                  value={(settings[key] as string) || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="mt-1 text-xs font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Font</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Font principale (display)</label>
            <Input
              value={settings.font_display}
              onChange={(e) => handleChange('font_display', e.target.value)}
              placeholder="BrushScriptMT"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Font personalizzato: BrushScriptMT (precaricato)</p>
          </div>
          <div>
            <label className="text-sm font-medium">Font secondario (body)</label>
            <Input
              value={settings.font_body}
              onChange={(e) => handleChange('font_body', e.target.value)}
              placeholder="system-ui"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Pulsanti</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Border radius</label>
            <Input value={settings.button_border_radius} onChange={(e) => handleChange('button_border_radius', e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Padding</label>
            <Input value={settings.button_padding} onChange={(e) => handleChange('button_padding', e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Hero</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Testo pulsante Hero</label>
            <Input value={settings.hero_button_text} onChange={(e) => handleChange('hero_button_text', e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Link pulsante Hero</label>
            <Input value={settings.hero_button_link} onChange={(e) => handleChange('hero_button_link', e.target.value)} className="mt-1" />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.hero_btn_bg || '#1a1a1a'}
              onChange={(e) => handleChange('hero_btn_bg', e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <div className="flex-1">
              <label className="text-sm font-medium">Sfondo pulsante Hero</label>
              <Input value={settings.hero_btn_bg} onChange={(e) => handleChange('hero_btn_bg', e.target.value)} className="mt-1 text-xs font-mono" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.hero_btn_text || '#c0c0c0'}
              onChange={(e) => handleChange('hero_btn_text', e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <div className="flex-1">
              <label className="text-sm font-medium">Testo pulsante Hero</label>
              <Input value={settings.hero_btn_text} onChange={(e) => handleChange('hero_btn_text', e.target.value)} className="mt-1 text-xs font-mono" />
            </div>
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Funzionalità</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Pulsante WhatsApp flottante</span>
              <p className="text-xs text-gray-500">Mostra il pulsante WhatsApp nelle pagine pubbliche</p>
            </div>
            <input
              type="checkbox"
              checked={settings.whatsapp_floating_enabled}
              onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_floating_enabled: e.target.checked }))}
              className="rounded h-5 w-5"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Sezione recensioni in Home</span>
              <p className="text-xs text-gray-500">Mostra anteprima recensioni nella homepage</p>
            </div>
            <input
              type="checkbox"
              checked={settings.reviews_section_enabled}
              onChange={(e) => setSettings(prev => ({ ...prev, reviews_section_enabled: e.target.checked }))}
              className="rounded h-5 w-5"
            />
          </label>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Anteprima</h2>
        <div className="p-4 rounded-lg" style={{ backgroundColor: settings.color_navbar_bg }}>
          <span style={{ color: settings.color_navbar_text, fontFamily: settings.font_display }} className="text-xl">
            Macelleria Amici
          </span>
        </div>
        <div className="mt-3 flex gap-3">
          <button
            className="px-4 py-2 rounded text-sm"
            style={{
              backgroundColor: settings.color_primary,
              color: settings.color_primary_foreground,
              borderRadius: settings.button_border_radius,
            }}
          >
            Pulsante primario
          </button>
          <button
            className="px-4 py-2 rounded text-sm border"
            style={{
              backgroundColor: settings.login_btn_bg,
              color: settings.login_btn_text,
              borderColor: settings.login_btn_border,
            }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
