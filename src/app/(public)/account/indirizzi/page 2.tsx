'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { MapPin } from 'lucide-react';
import type { ShippingAddress, BillingAddress } from '@/types';

const emptyShipping: Omit<ShippingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  first_name: '', last_name: '', street: '', street_number: '', zip_code: '', city: '', province: '', country: 'Italia', phone: '',
};
const emptyBilling: Omit<BillingAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  addressee_name: '', street: '', street_number: '', zip_code: '', city: '', province: '', country: 'Italia', phone: '',
};

export default function IndirizziPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const { t } = useLocale();
  const { settings } = useTheme();

  const [shipping, setShipping] = useState(emptyShipping);
  const [billing, setBilling] = useState(emptyBilling);
  const [saving, setSaving] = useState<'shipping' | 'billing' | null>(null);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: s } = await supabase.from('shipping_addresses').select('*').eq('user_id', user.id).single();
      if (s) setShipping(s as typeof shipping);
      const { data: b } = await supabase.from('billing_addresses').select('*').eq('user_id', user.id).single();
      if (b) setBilling(b as typeof billing);
    };
    load();
  }, [user, supabase]);

  const saveAddress = async (type: 'shipping' | 'billing') => {
    if (!user) return;
    setSaving(type); setSaved('');
    if (type === 'shipping') {
      await supabase.from('shipping_addresses').upsert({ ...shipping, user_id: user.id }, { onConflict: 'user_id' });
    } else {
      await supabase.from('billing_addresses').upsert({ ...billing, user_id: user.id }, { onConflict: 'user_id' });
    }
    setSaving(null); setSaved(type);
    setTimeout(() => setSaved(''), 3000);
  };

  const AddressForm = ({ title, data, onChange, onSave, type }: {
    title: string;
    data: Record<string, string>;
    onChange: (key: string, val: string) => void;
    onSave: () => void;
    type: 'shipping' | 'billing';
  }) => {
    const fields = type === 'shipping'
      ? [['first_name', 'Nome'], ['last_name', 'Cognome'], ['street', 'Via'], ['street_number', 'Civico'], ['zip_code', 'CAP'], ['city', 'Città'], ['province', 'Provincia'], ['country', 'Paese'], ['phone', 'Telefono']]
      : [['addressee_name', 'Intestatario'], ['street', 'Via'], ['street_number', 'Civico'], ['zip_code', 'CAP'], ['city', 'Città'], ['province', 'Provincia'], ['country', 'Paese'], ['phone', 'Telefono']];

    return (
      <div className="p-6 rounded-lg border border-border">
        <h2 className="font-display text-xl mb-4 flex items-center gap-2" style={{ color: settings.color_primary }}>
          <MapPin size={20} /> {title}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(([key, label]) => (
            <div key={key} className={key === 'street' || key === 'addressee_name' ? 'col-span-2 sm:col-span-1' : ''}>
              <label className="block text-xs font-medium mb-1">{label}</label>
              <Input value={data[key!] || ''} onChange={(e) => onChange(key!, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={onSave} isLoading={saving === type}
            style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}>
            {t('account.save')}
          </Button>
          {saved === type && <span className="text-sm text-green-600">{t('account.saved')}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl mb-8" style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}>
        {t('account.addresses')}
      </h1>
      <div className="space-y-6">
        <AddressForm
          title={t('checkout.shippingAddress')}
          data={shipping as unknown as Record<string, string>}
          onChange={(k, v) => setShipping(prev => ({ ...prev, [k]: v }))}
          onSave={() => saveAddress('shipping')}
          type="shipping"
        />
        <AddressForm
          title={t('checkout.billingAddress')}
          data={billing as unknown as Record<string, string>}
          onChange={(k, v) => setBilling(prev => ({ ...prev, [k]: v }))}
          onSave={() => saveAddress('billing')}
          type="billing"
        />
      </div>
    </div>
  );
}
