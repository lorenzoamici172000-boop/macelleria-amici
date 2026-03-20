import { createServerSupabase } from '@/lib/supabase/server';
import { getPublishedPageBySlug } from '@/services/navigation';
import { getBusinessSettings } from '@/services/settings';

export const metadata = { title: 'Privacy Policy' };

export default async function PrivacyPolicyPage() {
  const supabase = createServerSupabase();
  const [page, business] = await Promise.all([
    getPublishedPageBySlug(supabase, 'privacy-policy'),
    getBusinessSettings(supabase),
  ]);

  const content = page?.content as { body?: string } | null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-display mb-8" style={{ fontFamily: 'var(--font-display)' }}>
        Privacy Policy
      </h1>
      {content?.body ? (
        <div className="prose prose-sm max-w-none font-body" dangerouslySetInnerHTML={{ __html: content.body }} />
      ) : (
        <div className="font-body text-sm text-foreground/80 space-y-4">
          <p>
            <strong>Titolare del trattamento:</strong> {business.business_name}<br />
            Sede: {business.legal_address || business.operational_address}<br />
            Email: {business.email || 'info@macelleria-amici.it'}<br />
            Tel: {business.phone}
          </p>
          <h2 className="text-lg font-semibold mt-6">Finalità del trattamento</h2>
          <p>I dati personali vengono raccolti per: gestione degli account utente, elaborazione degli ordini, comunicazioni relative agli ordini, adempimenti fiscali e di legge, miglioramento del servizio.</p>
          <h2 className="text-lg font-semibold mt-6">Base giuridica</h2>
          <p>Il trattamento dei dati è basato sul consenso dell'utente e sull'esecuzione di un contratto (ordine/acquisto).</p>
          <h2 className="text-lg font-semibold mt-6">Diritti dell'interessato</h2>
          <p>L'utente può in qualsiasi momento richiedere l'accesso, la rettifica, la cancellazione dei propri dati personali contattandoci all'indirizzo indicato.</p>
          <p className="text-xs text-muted-foreground mt-8">
            Questa è un'informativa predefinita. Deve essere personalizzata dal titolare del trattamento.
          </p>
        </div>
      )}
    </div>
  );
}
