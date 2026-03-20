import { createServerSupabase } from '@/lib/supabase/server';
import { getBusinessSettings } from '@/services/settings';
import { getNavigationLinks } from '@/services/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFloating } from '@/components/shared/WhatsAppFloating';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { PageViewTracker } from '@/components/shared/PageViewTracker';

export const revalidate = 60; // Revalidate every 60s

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabase();
  const [business, links] = await Promise.all([
    getBusinessSettings(supabase),
    getNavigationLinks(supabase),
  ]);

  return (
    <>
      <Navbar links={links} />
      <main className="flex-1">{children}</main>
      <Footer business={business} />
      <WhatsAppFloating whatsappNumber={business.whatsapp || '3757059237'} />
      <CookieBanner />
      <PageViewTracker />
    </>
  );
}
