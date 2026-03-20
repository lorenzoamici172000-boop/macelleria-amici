'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, MapPin, FileText, Package, Heart, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';

export default function AccountPage() {
  const supabase = createClient();
  const { profile, refreshProfile } = useAuth();
  const { t } = useLocale();
  const { settings } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    await supabase.from('profiles').update({
      first_name: firstName,
      last_name: lastName,
      phone,
    }).eq('id', profile.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl mb-8"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {t('account.title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-2">
          {[
            { icon: User, label: t('account.profile'), href: '/account' },
            { icon: MapPin, label: t('account.addresses'), href: '/account/indirizzi' },
            { icon: FileText, label: t('account.billing'), href: '/account/fatturazione' },
            { icon: Package, label: t('account.orders'), href: '/i-miei-ordini' },
            { icon: Heart, label: t('account.wishlist'), href: '/preferiti' },
          ].map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm"
            >
              <Icon size={18} className="text-muted-foreground" />
              {label}
            </Link>
          ))}
        </div>

        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile */}
          <div className="p-6 rounded-lg border border-border">
            <h2 className="font-display text-xl mb-4" style={{ color: settings.color_primary }}>
              {t('account.profile')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('account.username')}</label>
                <div className="flex items-center gap-2">
                  <Input value={profile.username} disabled className="bg-muted" />
                  <Lock size={16} className="text-muted-foreground shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('account.usernameFixed')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('account.firstName')}</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('account.lastName')}</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('account.email')}</label>
                <Input value={profile.email} disabled className="bg-muted" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('account.phone')}</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  isLoading={saving}
                  style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}
                >
                  {t('account.save')}
                </Button>
                {saved && <span className="text-sm text-green-600">{t('account.saved')}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
