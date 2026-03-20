'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SiteSettings } from '@/types';
import { DEFAULT_SITE_SETTINGS } from '@/services/settings';

interface ThemeContextValue {
  settings: SiteSettings;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  settings: DEFAULT_SITE_SETTINGS,
  isLoading: true,
  refresh: async () => {},
});

export function ThemeProvider({ children, initialSettings }: { children: ReactNode; initialSettings?: SiteSettings }) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings ?? DEFAULT_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(!initialSettings);
  const supabase = createClient();

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setSettings({ ...DEFAULT_SITE_SETTINGS, ...data } as SiteSettings);
      }
    } catch {
      // Use defaults
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSettings) fetchSettings();
  }, []);

  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.color_primary);
    root.style.setProperty('--color-primary-foreground', settings.color_primary_foreground);
    root.style.setProperty('--color-secondary', settings.color_secondary);
    root.style.setProperty('--color-secondary-foreground', settings.color_secondary_foreground);
    root.style.setProperty('--color-accent', settings.color_accent);
    root.style.setProperty('--color-background', settings.color_background);
    root.style.setProperty('--color-foreground', settings.color_foreground);
    root.style.setProperty('--color-navbar-bg', settings.color_navbar_bg);
    root.style.setProperty('--color-navbar-text', settings.color_navbar_text);
    root.style.setProperty('--color-footer-bg', settings.color_footer_bg);
    root.style.setProperty('--color-footer-text', settings.color_footer_text);
    root.style.setProperty('--color-muted', settings.color_muted);
    root.style.setProperty('--color-border', settings.color_border);
    root.style.setProperty('--font-display', settings.font_display || 'BrushScriptMT');
    root.style.setProperty('--font-body', settings.font_body || 'system-ui');
    root.style.setProperty('--border-radius', settings.button_border_radius || '0.5rem');
  }, [settings]);

  return (
    <ThemeContext.Provider value={{ settings, isLoading, refresh: fetchSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
