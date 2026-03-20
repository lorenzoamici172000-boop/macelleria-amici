import { createServerSupabase } from '@/lib/supabase/server';
import { getPublishedPageBySlug } from '@/services/navigation';
import { getSiteSettings } from '@/services/settings';

export const metadata = { title: 'Chi siamo' };
export const revalidate = 120;

export default async function ChiSiamoPage() {
  const supabase = createServerSupabase();
  const [page, settings] = await Promise.all([
    getPublishedPageBySlug(supabase, 'chi-siamo'),
    getSiteSettings(supabase),
  ]);

  const content = page?.content as { body?: string; sections?: Array<{ title?: string; text?: string; image_url?: string }> } | null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1
        className="text-3xl md:text-4xl mb-8"
        style={{ fontFamily: 'var(--font-display)', color: settings.color_primary }}
      >
        {page?.title || 'Chi siamo'}
      </h1>

      {content?.body ? (
        <div
          className="prose prose-lg max-w-none font-body"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      ) : (
        <div className="font-body text-foreground/80 space-y-6">
          <p>
            Macelleria Amici è un punto di riferimento per la qualità delle carni a Roma.
            Da generazioni, selezioniamo le migliori carni per i nostri clienti, garantendo
            freschezza e qualità in ogni taglio.
          </p>
          <p>
            Vieni a trovarci nel nostro negozio o ordina direttamente dal sito.
          </p>
        </div>
      )}

      {content?.sections?.map((section, idx) => (
        <div key={idx} className="mt-8">
          {section.title && (
            <h2 className="text-xl font-display mb-4" style={{ color: settings.color_primary }}>
              {section.title}
            </h2>
          )}
          {section.text && <p className="font-body text-foreground/80">{section.text}</p>}
        </div>
      ))}
    </div>
  );
}
