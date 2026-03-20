'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getAllPages } from '@/services/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Eye, EyeOff, FileText } from 'lucide-react';
import { formatDate } from '@/utils/helpers';
import { revalidatePublicPages } from '@/utils/revalidate';
import type { Page } from '@/types';

export default function AdminPaginePage() {
  const supabase = createClient();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAllPages(supabase).then(data => { setPages(data); setIsLoading(false); });
  }, [supabase]);

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === 'published' ? 'draft' : 'published';
    await supabase.from('pages').update({ status: newStatus }).eq('id', id);
    const data = await getAllPages(supabase);
    setPages(data);
    // Revalidate public pages so the change is immediately visible
    revalidatePublicPages();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pagine</h1>
        <Link href="/admin/pagine/nuova">
          <Button className="bg-gray-900 text-white hover:bg-gray-800">
            <Plus size={16} className="mr-1" /> Nuova pagina
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Caricamento...</div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessuna pagina</div>
        ) : (
          pages.map((page) => (
            <div key={page.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
              <FileText size={18} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{page.title}</p>
                <p className="text-xs text-gray-400 font-mono">/{page.slug}</p>
              </div>
              <span className="text-xs text-gray-400">{formatDate(page.updated_at)}</span>
              {page.is_system && (
                <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600">Sistema</span>
              )}
              <button
                onClick={() => handleToggleStatus(page.id, page.status)}
                className={`px-2 py-0.5 rounded text-xs ${page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {page.status === 'published' ? <><Eye size={12} className="inline mr-1" />Pubblicata</> : <><EyeOff size={12} className="inline mr-1" />Bozza</>}
              </button>
              <Link href={`/admin/pagine/${page.id}`} className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                <Edit size={12} /> Modifica
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
