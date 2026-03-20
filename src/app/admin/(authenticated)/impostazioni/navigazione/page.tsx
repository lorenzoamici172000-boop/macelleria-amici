'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAllNavigationLinks, updateNavigationLink } from '@/services/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, GripVertical, Upload } from 'lucide-react';
import { getSiteSettings, updateSiteSettings } from '@/services/settings';
import { generateSafeFilename } from '@/utils/helpers';
import { validateImageFile } from '@/utils/validation';
import { revalidateSettings } from '@/utils/revalidate';
import type { NavigationLink, SiteSettings } from '@/types';

export default function AdminNavigazionePage() {
  const supabase = createClient();
  const [links, setLinks] = useState<NavigationLink[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    const [navLinks, siteSettings] = await Promise.all([
      getAllNavigationLinks(supabase),
      getSiteSettings(supabase),
    ]);
    setLinks(navLinks);
    setSettings(siteSettings);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const handleToggleVisibility = async (id: string, current: boolean) => {
    await updateNavigationLink(supabase, id, { is_visible: !current });
    load();
  };

  const handleUpdateLabel = async (id: string, labelIt: string, labelEn: string) => {
    await updateNavigationLink(supabase, id, { label_it: labelIt, label_en: labelEn });
    setSaved('Link aggiornato');
    revalidateSettings();
    setTimeout(() => setSaved(''), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validErr = validateImageFile(file);
    if (validErr) { setError(validErr); return; }
    const filename = `logo-${generateSafeFilename(file.name)}`;
    const { data, error: uploadErr } = await supabase.storage.from('site-assets').upload(filename, file, { contentType: file.type, upsert: true });
    if (uploadErr) { setError(uploadErr.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(data.path);
    await updateSiteSettings(supabase, { logo_url: publicUrl });
    setSettings(prev => prev ? { ...prev, logo_url: publicUrl } : prev);
    setSaved('Logo aggiornato');
    revalidateSettings();
    setTimeout(() => setSaved(''), 2000);
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const filename = `favicon-${generateSafeFilename(file.name)}`;
    const { data, error: uploadErr } = await supabase.storage.from('site-assets').upload(filename, file, { contentType: file.type, upsert: true });
    if (uploadErr) { setError(uploadErr.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(data.path);
    await updateSiteSettings(supabase, { favicon_url: publicUrl });
    setSettings(prev => prev ? { ...prev, favicon_url: publicUrl } : prev);
    setSaved('Favicon aggiornato');
    revalidateSettings();
    setTimeout(() => setSaved(''), 2000);
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validErr = validateImageFile(file);
    if (validErr) { setError(validErr); return; }
    const filename = `hero-${generateSafeFilename(file.name)}`;
    const { data, error: uploadErr } = await supabase.storage.from('site-assets').upload(filename, file, { contentType: file.type, upsert: true });
    if (uploadErr) { setError(uploadErr.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(data.path);
    await updateSiteSettings(supabase, { hero_image_url: publicUrl });
    setSettings(prev => prev ? { ...prev, hero_image_url: publicUrl } : prev);
    setSaved('Immagine Hero aggiornata');
    revalidateSettings();
    setTimeout(() => setSaved(''), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Navigazione e Media</h1>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      {saved && <div className="p-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm">{saved}</div>}

      {/* Logo, Favicon, Hero */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-semibold">Logo, Favicon e Hero</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Logo</label>
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="Logo" className="w-20 h-20 object-contain mb-2 rounded border" />
            )}
            <label className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded border cursor-pointer hover:bg-gray-50">
              <Upload size={14} /> Carica logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Favicon</label>
            {settings?.favicon_url && (
              <img src={settings.favicon_url} alt="Favicon" className="w-10 h-10 object-contain mb-2 rounded border" />
            )}
            <label className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded border cursor-pointer hover:bg-gray-50">
              <Upload size={14} /> Carica favicon
              <input type="file" accept="image/*" className="hidden" onChange={handleFaviconUpload} />
            </label>
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Immagine Hero</label>
            {settings?.hero_image_url && (
              <img src={settings.hero_image_url} alt="Hero" className="w-32 h-20 object-cover mb-2 rounded border" />
            )}
            <label className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded border cursor-pointer hover:bg-gray-50">
              <Upload size={14} /> Carica hero
              <input type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Voci di navigazione</h2>
          <p className="text-xs text-gray-500">Modifica etichette e visibilità. L'ordine segue il campo display_order.</p>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Caricamento...</div>
          ) : (
            links.map((link) => (
              <NavLinkEditor
                key={link.id}
                link={link}
                onToggle={() => handleToggleVisibility(link.id, link.is_visible)}
                onSave={(labelIt, labelEn) => handleUpdateLabel(link.id, labelIt, labelEn)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NavLinkEditor({ link, onToggle, onSave }: {
  link: NavigationLink;
  onToggle: () => void;
  onSave: (labelIt: string, labelEn: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [labelIt, setLabelIt] = useState(link.label_it);
  const [labelEn, setLabelEn] = useState(link.label_en);

  return (
    <div className="p-4 flex items-center gap-3">
      <GripVertical size={16} className="text-gray-300 shrink-0" />
      {editing ? (
    <div className="flex-1 flex gap-2">
      <Input value={labelIt} onChange={(e) => setLabelIt(e.target.value)} placeholder="IT" className="text-sm" />
      <Input value={labelEn} onChange={(e) => setLabelEn(e.target.value)} placeholder="EN" className="text-sm" />
      <Button size="sm" onClick={() => { onSave(labelIt, labelEn); setEditing(false); }}>Salva</Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>×</Button>
    </div>
      ) : (
    <>
      <div className="flex-1">
        <span className="text-sm font-medium">{link.label_it}</span>
        {link.label_en && <span className="text-xs text-gray-400 ml-2">/ {link.label_en}</span>}
        <span className="text-xs text-gray-400 font-mono ml-2">{link.href}</span>
      </div>
      {link.is_system && <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">Sistema</span>}
      <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">Modifica</button>
    </>
      )}
      <button onClick={onToggle} className={`p-1 rounded ${link.is_visible ? 'text-green-600' : 'text-gray-400'}`}>
    {link.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  );
}
