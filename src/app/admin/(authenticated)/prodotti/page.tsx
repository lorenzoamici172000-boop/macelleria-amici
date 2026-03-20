'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getProducts } from '@/services/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCents } from '@/utils/currency';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import type { Product } from '@/types';

export default function AdminProdottiPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      // Admin can see all products including inactive
      const { data, count } = await supabase
    .from('products')
    .select('*, category:categories(name)', { count: 'exact' })
    .ilike('name', `%${search}%`)
    .order('display_order', { ascending: true })
    .range((page - 1) * 20, page * 20 - 1);
      setProducts((data ?? []) as Product[]);
      setTotal(count ?? 0);
      setIsLoading(false);
    };
    load();
  }, [supabase, search, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Prodotti</h1>
        <Link href="/admin/prodotti/nuovo">
          <Button className="bg-gray-900 text-white hover:bg-gray-800">
            <Plus size={16} className="mr-1" /> Nuovo prodotto
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Cerca prodotti..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium">Nome</th>
              <th className="text-left p-3 font-medium">Categoria</th>
              <th className="text-right p-3 font-medium">Prezzo</th>
              <th className="text-right p-3 font-medium">Sconto</th>
              <th className="text-center p-3 font-medium">Stock</th>
              <th className="text-center p-3 font-medium">IVA</th>
              <th className="text-center p-3 font-medium">Stato</th>
              <th className="text-center p-3 font-medium">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="p-3"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">Nessun prodotto</td></tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-gray-500">{(product.category as unknown as { name?: string })?.name || '-'}</td>
                  <td className="p-3 text-right">{formatCents(product.price_cent)}</td>
                  <td className="p-3 text-right text-red-600">{product.discount_price_cent ? formatCents(product.discount_price_cent) : '-'}</td>
                  <td className="p-3 text-center">
                    <span className={product.stock === 0 ? 'text-red-600 font-bold' : product.stock <= 5 ? 'text-yellow-600' : ''}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-3 text-center text-gray-500">{(product.vat_rate / 100).toFixed(0)}%</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {product.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Link href={`/admin/prodotti/${product.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
                      <Edit size={12} /> Modifica
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
