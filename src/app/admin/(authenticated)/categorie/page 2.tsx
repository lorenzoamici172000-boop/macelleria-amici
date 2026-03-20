'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCategories, createCategory } from '@/services/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateSlug } from '@/utils/validation';
import { revalidatePublicPages } from '@/utils/revalidate';
import { Plus, Edit, Eye, EyeOff } from 'lucide-react';
import type { Category } from '@/types';

export default function AdminCategoriePage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('categories').select('*').order('display_order');
    setCategories((data ?? []) as Category[]);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [supabase]);

  const handleAdd = async () => {
    setError('');
    if (!newName.trim()) { setError('Nome obbligatorio'); return; }
    const slug = generateSlug(newName);
    const result = await createCategory(supabase, {
      name: newName.trim(),
      slug,
      display_order: categories.length + 1,
    });
    if (result.error) { setError(result.error); return; }
    setNewName('');
    revalidatePublicPages();
    load();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await supabase.from('categories').update({
      name: editName.trim(),
      slug: generateSlug(editName),
    }).eq('id', id);
    setEditingId(null);
    load();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await supabase.from('categories').update({ is_active: !isActive }).eq('id', id);
    load();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Categorie</h1>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="flex gap-3">
        <Input placeholder="Nome categoria" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <Button onClick={handleAdd} className="bg-gray-900 text-white hover:bg-gray-800 shrink-0">
          <Plus size={16} className="mr-1" /> Aggiungi
        </Button>
      </div>

      <div className="bg-white rounded-lg border divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Caricamento...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nessuna categoria</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="p-4 flex items-center gap-3">
              {editingId === cat.id ? (
                <>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)} autoFocus />
                  <Button size="sm" onClick={() => handleUpdate(cat.id)}>Salva</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annulla</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{cat.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{cat.slug}</span>
                  <button onClick={() => handleToggle(cat.id, cat.is_active)}
                    className={`p-1 rounded ${cat.is_active ? 'text-green-600' : 'text-gray-400'}`}
                    title={cat.is_active ? 'Attiva' : 'Inattiva'}>
                    {cat.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="p-1 text-gray-400 hover:text-gray-600">
                    <Edit size={16} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
