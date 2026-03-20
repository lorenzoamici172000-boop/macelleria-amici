'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import type { InvoiceProfile } from '@/types';

export default function FatturazionePage() {
  const supabase = createClient();
  const { user } = useAuth();
  const { t } = useLocale();
  const { settings } = useTheme();

  const [invoiceType, setInvoiceType] = useState<'private' | 'company'>('private');
  const [form, setForm] = useState({
    first_name: '', last_name: '', tax_code: '',
    company_name: '', vat_number: '', sdi_code: '', pec: '', full_address: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('invoice_profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        const ip = data as InvoiceProfile;
        setInvoiceType(ip.invoice_type);
        setForm({
          first_name: ip.first_name || '', last_name: ip.last_name || '', tax_code: ip.tax_code || '',
          company_name: ip.company_name || '', vat_number: ip.vat_number || '',
          sdi_code: ip.sdi_code || '', pec: ip.pec || '', full_address: ip.full_address || '',
        });
      }
    });
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user) return;
    setError(''); setSaved(false); setSaving(true);

    if (invoiceType === 'private') {
      if (!form.first_name || !form.last_name || !form.tax_code || !form.full_address) {
        setError('Tutti i campi per privato sono obbligatori'); setSaving(false); return;
      }
      if (form.tax_code.length !== 16) {
        setError('Codice fiscale: 16 caratteri'); setSaving(false); return;
      }
    } else {
      if (!form.company_name || !form.vat_number || !form.sdi_code || !form.pec || !form.full_address) {
        setError('Tutti i campi per azienda sono obbligatori'); setSaving(false); return;
      }
      if (form.vat_number.length !== 11) {
        setError('Partita IVA: 11 cifre'); setSaving(false); return;
      }
    }

    await supabase.from('invoice_profiles').upsert({
      user_id: user.id,
      invoice_type: invoiceType,
      ...form,
    }, { onConflict: 'user_id' });

    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl mb-8" style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}>
        {t('account.billing')}
      </h1>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>}

      <div className="p-6 rounded-lg border space-y-4">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo fatturazione</label>
          <div className="flex gap-3">
            <button onClick={() => setInvoiceType('private')}
              className={`px-4 py-2 rounded text-sm border ${invoiceType === 'private' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
              Privato
            </button>
            <button onClick={() => setInvoiceType('company')}
              className={`px-4 py-2 rounded text-sm border ${invoiceType === 'company' ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
              Azienda
            </button>
          </div>
        </div>

        {invoiceType === 'private' ? (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium mb-1">Nome *</label>
              <Input value={form.first_name} onChange={(e) => setForm(p => ({ ...p, first_name: e.target.value }))} /></div>
            <div><label className="block text-xs font-medium mb-1">Cognome *</label>
              <Input value={form.last_name} onChange={(e) => setForm(p => ({ ...p, last_name: e.target.value }))} /></div>
            <div className="col-span-2"><label className="block text-xs font-medium mb-1">Codice Fiscale * (16 caratteri)</label>
              <Input value={form.tax_code} onChange={(e) => setForm(p => ({ ...p, tax_code: e.target.value.toUpperCase() }))} maxLength={16} className="font-mono" /></div>
            <div className="col-span-2"><label className="block text-xs font-medium mb-1">Indirizzo completo *</label>
              <Input value={form.full_address} onChange={(e) => setForm(p => ({ ...p, full_address: e.target.value }))} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs font-medium mb-1">Ragione Sociale *</label>
              <Input value={form.company_name} onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))} /></div>
            <div><label className="block text-xs font-medium mb-1">Partita IVA * (11 cifre)</label>
              <Input value={form.vat_number} onChange={(e) => setForm(p => ({ ...p, vat_number: e.target.value }))} maxLength={11} className="font-mono" /></div>
            <div><label className="block text-xs font-medium mb-1">Codice SDI *</label>
              <Input value={form.sdi_code} onChange={(e) => setForm(p => ({ ...p, sdi_code: e.target.value.toUpperCase() }))} maxLength={7} className="font-mono" /></div>
            <div className="col-span-2"><label className="block text-xs font-medium mb-1">PEC *</label>
              <Input type="email" value={form.pec} onChange={(e) => setForm(p => ({ ...p, pec: e.target.value }))} /></div>
            <div className="col-span-2"><label className="block text-xs font-medium mb-1">Indirizzo completo *</label>
              <Input value={form.full_address} onChange={(e) => setForm(p => ({ ...p, full_address: e.target.value }))} /></div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} isLoading={saving}
            style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}>
            {t('account.save')}
          </Button>
          {saved && <span className="text-sm text-green-600">{t('account.saved')}</span>}
        </div>
      </div>
    </div>
  );
}
