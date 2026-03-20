import { createServerSupabase } from '@/lib/supabase/server';
import { getProductBySlug } from '@/services/products';
import { ProductDetail } from '@/components/products/ProductDetail';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createServerSupabase();
  const product = await getProductBySlug(supabase, params.slug);
  if (!product) return { title: 'Prodotto non trovato' };
  return {
    title: product.name,
    description: product.description?.slice(0, 155) || `${product.name} - Macelleria Amici`,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase();
  const product = await getProductBySlug(supabase, params.slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
