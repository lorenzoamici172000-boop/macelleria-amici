'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function PasswordResetPage() {
  const supabase = createClient();
  const { t } = useLocale();
  const { settings } = useTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/profilo`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError('Errore imprevisto. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-display mb-4" style={{ color: settings.color_primary }}>
            Email inviata
          </h1>
          <p className="text-muted-foreground mb-6">
            Se l&apos;indirizzo è associato a un account, riceverai un&apos;email con le istruzioni per reimpostare la password.
          </p>
          <Link href="/login">
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-2" /> Torna al login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} /> Torna al login
        </Link>

        <h1
          className="text-3xl text-center mb-4"
          style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
        >
          {t('auth.forgotPassword')}
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-8">
          Inserisci la tua email e ti invieremo un link per reimpostare la password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10"
                placeholder="email@esempio.it"
              />
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}
          >
            Invia link di reset
          </Button>
        </form>
      </div>
    </div>
  );
}
