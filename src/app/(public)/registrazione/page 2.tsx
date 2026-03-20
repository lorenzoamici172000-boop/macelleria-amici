'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { registrationSchema, type RegistrationData } from '@/utils/validation';

export default function RegistrazionePage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();
  const { settings } = useTheme();

  const [form, setForm] = useState<RegistrationData & { acceptPrivacy: boolean }>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptPrivacy: false as unknown as true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setErrors({});

    // Validate
    const validation = registrationSchema.safeParse(form);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        const field = err.path[0];
        if (field) fieldErrors[field.toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Check username availability (case-insensitive)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username_lower', form.username.toLowerCase())
        .single();

      if (existingUser) {
        setErrors({ username: t('auth.usernameTaken') });
        setIsLoading(false);
        return;
      }

      // Register with Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            username: form.username,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setGlobalError(t('auth.emailTaken'));
        } else {
          setGlobalError(t('auth.registerFailed'));
        }
        setIsLoading(false);
        return;
      }

      router.push('/account');
      router.refresh();
    } catch {
      setGlobalError(t('auth.registerFailed'));
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
          {t('auth.register')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {globalError && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
              {globalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.firstName')} *</label>
              <Input
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                error={errors.firstName}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth.lastName')} *</label>
              <Input
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                error={errors.lastName}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.username')} *</label>
            <Input
              value={form.username}
              onChange={(e) => updateField('username', e.target.value)}
              error={errors.username}
              required
              maxLength={13}
              placeholder={t('auth.usernameHint')}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('auth.usernameHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.email')} *</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.password')} *</label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              error={errors.password}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('auth.confirmPassword')} *</label>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              required
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.acceptPrivacy as boolean}
              onChange={(e) => updateField('acceptPrivacy', e.target.checked)}
              className="mt-0.5 rounded"
              required
            />
            <span>
              {t('auth.acceptPrivacy')}{' '}
              <Link href="/privacy-policy" className="underline" target="_blank">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptPrivacy && (
            <p className="text-xs text-destructive">{errors.acceptPrivacy}</p>
          )}

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            style={{ backgroundColor: settings.color_primary, color: settings.color_primary_foreground }}
          >
            {t('auth.register')}
          </Button>
        </form>

        <p className="text-center text-sm mt-6 text-muted-foreground">
          {t('auth.hasAccount')}{' '}
          <Link href="/login" className="underline hover:opacity-80" style={{ color: settings.color_primary }}>
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
