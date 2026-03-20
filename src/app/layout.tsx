import type { Metadata } from 'next';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSiteSettings, getBusinessSettings } from '@/services/settings';
import { AuthProvider } from '@/hooks/useAuth';
import { LocaleProvider } from '@/hooks/useLocale';
import { ThemeProvider } from '@/hooks/useTheme';
import { CartProvider } from '@/hooks/useCart';
import { WishlistProvider } from '@/hooks/useWishlist';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createServerSupabase();
  const [site, business] = await Promise.all([
    getSiteSettings(supabase),
    getBusinessSettings(supabase),
  ]);

  return {
    title: {
      default: business.business_name || 'Macelleria Amici',
      template: `%s | ${business.business_name || 'Macelleria Amici'}`,
    },
    description: `${business.business_name} - Macelleria di qualità a Roma`,
    icons: site.favicon_url ? { icon: site.favicon_url } : undefined,
    openGraph: {
      type: 'website',
      locale: 'it_IT',
      siteName: business.business_name || 'Macelleria Amici',
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabase();
  const siteSettings = await getSiteSettings(supabase);

  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/BrushScriptMT.ttf" as="font" type="font/truetype" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <LocaleProvider>
            <ThemeProvider initialSettings={siteSettings}>
              <CartProvider>
                <WishlistProvider>
                  {children}
                  <Toaster />
                </WishlistProvider>
              </CartProvider>
            </ThemeProvider>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
