'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createPage, updatePage } from '@/services/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateSlug } from '@/utils/validation';
import { revalidatePage } from '@/utils/revalidate';
import { ArrowLeft } from 'lucide-react';
import type { Page } from '@/types';

export default function AdminPageFormPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!params.id && params.id !== 'nuova';

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    body: '',
    status: 'draft' as 'draft' | 'published',
    meta_title: '',
    meta_description: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    supabase.from('pages').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
    const page = data as Page;
    const content = page.content as { body?: string } | null;
    setForm({
      title: page.title,
      slug: page.slug,
      body: content?.body || '',
      status: page.status,
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
    });
      }
      setIsLoading(false);
    });
  }, [supabase, isEdit, params.id]);

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: isEdit ? prev.slug : generateSlug(title),
      meta_title: isEdit ? prev.meta_title : title.slice(0, 60),
    }));
  };

  const handleSave = async () => {
    setError('');
    if (!form.title.trim()) { setError('Titolo obbligatorio'); return; }
    if (!form.slug.trim()) { setError('Slug obbligatorio'); return; }

    setIsSaving(true);
    const pageData = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      content: { body: form.body },
      status: form.status,
      meta_title: form.meta_title || form.title.slice(0, 60),
      meta_description: form.meta_description,
    };

    if (isEdit) {
      const result = await updatePage(supabase, params.id as string, pageData);
      if (!result.success) { setError(result.error || 'Errore'); setIsSaving(false); return; }
    } else {
      const result = await createPage(supabase, pageData);
      if (result.error) { setError(result.error); setIsSaving(false); return; }
    }

    revalidatePage(form.slug);
    router.push('/admin/pagine');
  };

  if (isLoading) return (
    <div className="animate-pulse h-96 bg-gray-200 rounded max-w-2xl" />
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/pagine" className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold">{isEdit ? 'Modifica pagina' : 'Nuova pagina'}</h1>
      </div>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Titolo *</label>
          <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} className="font-mono text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contenuto (HTML)</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm(p => ({ ...p, body: e.target.value }))}
            className="w-full h-64 px-3 py-2 rounded-md border text-sm font-mono resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stato</label>
          <select className="h-10 px-3 rounded-md border text-sm" value={form.status}
            onChange={(e) => setForm(p => ({ ...p, status: e.target.value as 'draft' | 'published' }))}>
            <option value="draft">Bozza</option>
            <option value="published">Pubblicata</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">SEO</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Meta Title (max 60)</label>
              <Input value={form.meta_title} maxLength={60}
                onChange={(e) => setForm(p => ({ ...p, meta_title: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">{form.meta_title.length}/60</p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Meta Description (max 155)</label>
              <textarea
                value={form.meta_description}
                maxLength={155}
                onChange={(e) => setForm(p => ({ ...p, meta_description: e.target.value }))}
                className="w-full h-20 px-3 py-2 rounded-md border text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{form.meta_description.length}/155</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} isLoading={isSaving} className="bg-gray-900 text-white hover:bg-gray-800">
          {isEdit ? 'Salva modifiche' : 'Crea pagina'}
        </Button>
        <Link href="/admin/pagine"><Button variant="outline">Annulla</Button></Link>
      </div>
    </div>
  );
}
