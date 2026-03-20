'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { loginSchema } from '@/utils/validation';
import type { z } from 'zod';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const supabase = createClient();
  const { t } = useLocale();
  const { settings } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.errors[0]?.message || t('auth.loginFailed'));
      return;
    }

    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(t('auth.loginFailed'));
      } else {
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError(t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1
          className="text-3xl text-center mb-8"
          style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
        >
          {t('auth.login')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex justify-end">
            <Link href="/login/reset-password" className="text-xs text-muted-foreground hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}
          >
            {t('auth.login')}
          </Button>
        </form>

        <p className="text-center text-sm mt-6 text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link href="/registrazione" className="underline hover:opacity-80" style={{ color: settings.color_primary }}>
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
