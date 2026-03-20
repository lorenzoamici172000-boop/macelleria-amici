'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getProductById, getCategories, createProduct, updateProduct } from '@/services/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateSlug, validateImageFile } from '@/utils/validation';
import { revalidateProducts } from '@/utils/revalidate';
import { decimalToCents, centsToDecimal } from '@/utils/currency';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import type { Product, Category } from '@/types';
import Link from 'next/link';
import { generateSafeFilename } from '@/utils/helpers';

export default function AdminProductFormPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!params.id && params.id !== 'nuovo';

  const [categories, setCats] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price_decimal: '',
    discount_decimal: '',
    stock: '0',
    category_id: '',
    vat_rate: '2200',
    pickup_enabled: true,
    shipping_enabled: false,
    is_active: true,
    display_order: '0',
  });

  useEffect(() => {
    const load = async () => {
      const cats = await getCategories(supabase);
      setCats(cats);

      if (isEdit) {
    const product = await getProductById(supabase, params.id as string);
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price_decimal: centsToDecimal(product.price_cent),
        discount_decimal: product.discount_price_cent ? centsToDecimal(product.discount_price_cent) : '',
        stock: String(product.stock),
        category_id: product.category_id || '',
        vat_rate: String(product.vat_rate),
        pickup_enabled: product.pickup_enabled,
        shipping_enabled: product.shipping_enabled,
        is_active: product.is_active,
        display_order: String(product.display_order),
      });
      setImages((product.images || []).map(i => ({ id: i.id, url: i.url })));
    }
      }
      setIsLoading(false);
    };
    load();
  }, [supabase, isEdit, params.id]);

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: isEdit ? prev.slug : generateSlug(name),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) { setError(validationError); return; }

    const filename = generateSafeFilename(file.name);
    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filename, file, { contentType: file.type });

    if (uploadError) { setError('Errore upload: ' + uploadError.message); return; }

    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path);

    if (isEdit) {
      await supabase.from('product_images').insert({
    product_id: params.id,
    url: publicUrl,
    alt_text: form.name,
    display_order: images.length,
      });
    }

    setImages(prev => [...prev, { id: Date.now().toString(), url: publicUrl }]);
    e.target.value = '';
  };

  const handleRemoveImage = async (imageId: string) => {
    if (isEdit) {
      await supabase.from('product_images').delete().eq('id', imageId);
    }
    setImages(prev => prev.filter(i => i.id !== imageId));
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) { setError('Nome obbligatorio'); return; }
    if (!form.slug.trim()) { setError('Slug obbligatorio'); return; }
    if (!form.price_decimal || parseFloat(form.price_decimal) <= 0) { setError('Prezzo deve essere maggiore di zero'); return; }

    const priceCent = decimalToCents(form.price_decimal);
    const discountCent = form.discount_decimal ? decimalToCents(form.discount_decimal) : null;

    if (discountCent !== null && discountCent >= priceCent) {
      setError('Lo sconto deve essere inferiore al prezzo'); return;
    }

    setIsSaving(true);

    const productData = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description,
      price_cent: priceCent,
      discount_price_cent: discountCent,
      stock: parseInt(form.stock) || 0,
      category_id: form.category_id || null,
      vat_rate: parseInt(form.vat_rate) || 2200,
      pickup_enabled: form.pickup_enabled,
      shipping_enabled: form.shipping_enabled,
      is_active: form.is_active,
      display_order: parseInt(form.display_order) || 0,
    };

    if (isEdit) {
      const result = await updateProduct(supabase, params.id as string, productData);
      if (!result.success) { setError(result.error || 'Errore'); setIsSaving(false); return; }
    } else {
      const result = await createProduct(supabase, productData as Parameters<typeof createProduct>[1]);
      if (result.error) { setError(result.error); setIsSaving(false); return; }
      // Add images for new product
      if (result.data && images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      await supabase.from('product_images').insert({
        product_id: result.data.id,
        url: images[i]!.url,
        alt_text: form.name,
        display_order: i,
      });
    }
      }
    }

    revalidateProducts(form.slug);
    router.push('/admin/prodotti');
  };

  if (isLoading) return (
    <div className="animate-pulse h-96 bg-gray-200 rounded max-w-2xl" />
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/prodotti" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">{isEdit ? 'Modifica prodotto' : 'Nuovo prodotto'}</h1>
      </div>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <Input value={form.slug} onChange={(e) => setForm(p => ({ ...p, slug: e.target.value }))} className="font-mono text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Descrizione</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full h-32 px-3 py-2 rounded-md border text-sm resize-none"
              maxLength={5000}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prezzo (€) *</label>
            <Input type="number" step="0.01" min="0.01" value={form.price_decimal} onChange={(e) => setForm(p => ({ ...p, price_decimal: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prezzo scontato (€)</label>
            <Input type="number" step="0.01" min="0" value={form.discount_decimal} onChange={(e) => setForm(p => ({ ...p, discount_decimal: e.target.value }))} placeholder="Lascia vuoto se nessuno sconto" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock *</label>
            <Input type="number" min="0" value={form.stock} onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select className="w-full h-10 px-3 rounded-md border text-sm" value={form.category_id} onChange={(e) => setForm(p => ({ ...p, category_id: e.target.value }))}>
              <option value="">-- Nessuna --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">IVA (basis points)</label>
            <select className="w-full h-10 px-3 rounded-md border text-sm" value={form.vat_rate} onChange={(e) => setForm(p => ({ ...p, vat_rate: e.target.value }))}>
              <option value="2200">22%</option>
              <option value="1000">10%</option>
              <option value="500">5%</option>
              <option value="400">4%</option>
              <option value="0">0% (Esente)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ordine visualizzazione</label>
            <Input type="number" min="0" value={form.display_order} onChange={(e) => setForm(p => ({ ...p, display_order: e.target.value }))} />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6 pt-4 border-t">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))} className="rounded" />
            Attivo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.pickup_enabled} onChange={(e) => setForm(p => ({ ...p, pickup_enabled: e.target.checked }))} className="rounded" />
            Ritirabile
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.shipping_enabled} onChange={(e) => setForm(p => ({ ...p, shipping_enabled: e.target.checked }))} className="rounded" />
            Spedibile
          </label>
        </div>

        {/* Images */}
        <div className="pt-4 border-t">
          <label className="block text-sm font-medium mb-2">Immagini</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((img) => (
              <div key={img.id} className="relative w-24 h-24 rounded border overflow-hidden group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 rounded border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload size={20} className="text-gray-400" />
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <p className="text-xs text-gray-500">JPG, PNG, WebP. Max 10MB. Formato consigliato: quadrato 1:1</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} isLoading={isSaving} className="bg-gray-900 text-white hover:bg-gray-800">
          {isEdit ? 'Salva modifiche' : 'Crea prodotto'}
        </Button>
        <Link href="/admin/prodotti">
          <Button variant="outline">Annulla</Button>
        </Link>
      </div>
    </div>
  );
}
