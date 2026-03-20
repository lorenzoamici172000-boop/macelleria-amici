'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/components/ui/toaster';
import { KeyRound, Mail } from 'lucide-react';

export default function ProfiloPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const { t } = useLocale();
  const { settings } = useTheme();

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      toast.error('La password deve avere almeno 8 caratteri');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Le password non coincidono');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error('Errore nel cambio password: ' + error.message);
      } else {
        toast.success('Password aggiornata correttamente');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      toast.error('Errore imprevisto');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Email non valida');
      return;
    }

    setChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) {
        toast.error('Errore nel cambio email: ' + error.message);
      } else {
        toast.success('Email di conferma inviata al nuovo indirizzo');
        setNewEmail('');
      }
    } catch {
      toast.error('Errore imprevisto');
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl mb-8"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        Sicurezza account
      </h1>

      <div className="space-y-6">
        {/* Email change */}
        <div className="p-6 rounded-lg border border-border">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2" style={{ color: settings.color_primary }}>
            <Mail size={20} /> {t('account.email')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Email attuale: <strong>{user?.email}</strong>
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nuova email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nuova@email.it"
              />
            </div>
            <Button
              onClick={handleEmailChange}
              isLoading={changingEmail}
              disabled={!newEmail}
              style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}
            >
              Aggiorna email
            </Button>
          </div>
        </div>

        {/* Password change */}
        <div className="p-6 rounded-lg border border-border">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2" style={{ color: settings.color_primary }}>
            <KeyRound size={20} /> {t('account.password')}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('account.newPassword')}</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 8 caratteri"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('account.confirmPassword')}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              isLoading={changingPassword}
              disabled={!newPassword || !confirmPassword}
              style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}
            >
              Aggiorna password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
