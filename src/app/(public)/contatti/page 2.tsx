import { createServerSupabase } from '@/lib/supabase/server';
import { getBusinessSettings } from '@/services/settings';
import { ContactsContent } from '@/components/shared/ContactsContent';

export const metadata = { title: 'Contatti' };
export const revalidate = 300;

export default async function ContattiPage() {
  const supabase = createServerSupabase();
  const business = await getBusinessSettings(supabase);
  return <ContactsContent business={business} />;
}
