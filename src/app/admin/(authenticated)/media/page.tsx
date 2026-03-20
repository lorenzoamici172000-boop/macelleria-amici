'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Copy, Check } from 'lucide-react';
import { validateImageFile } from '@/utils/validation';
import { generateSafeFilename, formatDate } from '@/utils/helpers';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export default function AdminMediaPage() {
  const supabase = createClient();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false });
    setItems((data ?? []) as MediaItem[]);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [supabase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError('');
    setIsUploading(true);

    for (const file of Array.from(files)) {
      const validErr = validateImageFile(file);
      if (validErr) { setError(validErr); continue; }

      const safeName = generateSafeFilename(file.name);
      const { data, error: uploadErr } = await supabase.storage
    .from('media')
    .upload(safeName, file, { contentType: file.type });

      if (uploadErr) { setError(uploadErr.message); continue; }

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.path);

      await supabase.from('media_assets').insert({
    filename: file.name,
    url: publicUrl,
    mime_type: file.type,
    size_bytes: file.size,
      });
    }

    setIsUploading(false);
    e.target.value = '';
    load();
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Eliminare ${item.filename}?`)) return;
    await supabase.from('media_assets').delete().eq('id', item.id);
    load();
  };

  const copyUrl = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Media</h1>
        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium cursor-pointer ${isUploading ? 'bg-gray-300' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
          <Upload size={16} />
          {isUploading ? 'Caricamento...' : 'Carica file'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleUpload} disabled={isUploading} />
        </label>
      </div>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <p className="text-xs text-gray-500">Formati: JPG, PNG, WebP. Max 10MB per file.</p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Nessun file caricato</p>
          <p className="text-sm mt-1">Carica immagini per usarle nel sito</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group relative bg-white rounded-lg border overflow-hidden">
              <div className="aspect-square">
                <img src={item.url} alt={item.filename} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-2">
                <p className="text-xs truncate">{item.filename}</p>
                <p className="text-xs text-gray-400">{(item.size_bytes / 1024).toFixed(0)} KB</p>
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(item.url, item.id)}
                  className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
                  title="Copia URL"
                >
                  {copiedId === item.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                  title="Elimina"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
