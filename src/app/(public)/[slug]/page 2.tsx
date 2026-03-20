import { createServerSupabase } from '@/lib/supabase/server';
import { getPublishedPageBySlug } from '@/services/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createServerSupabase();
  const page = await getPublishedPageBySlug(supabase, params.slug);
  if (!page) return {};
  return {
    title: page.meta_title || page.title,
    description: page.meta_description || '',
  };
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase();
  const page = await getPublishedPageBySlug(supabase, params.slug);
  if (!page) notFound();

  const content = page.content as { body?: string } | null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl md:text-4xl font-display mb-8">{page.title}</h1>
      {content?.body ? (
        <div className="prose prose-lg max-w-none font-body" dangerouslySetInnerHTML={{ __html: content.body }} />
      ) : (
        <p className="text-muted-foreground">Contenuto in arrivo.</p>
      )}
    </div>
  );
}
