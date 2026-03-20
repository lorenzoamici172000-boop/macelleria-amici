import type { SupabaseClient } from '@supabase/supabase-js';
import type { NavigationLink, Page } from '@/types';

export async function getNavigationLinks(supabase: SupabaseClient): Promise<NavigationLink[]> {
  const { data } = await supabase
    .from('navigation_links')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  return (data ?? []) as NavigationLink[];
}

export async function getAllNavigationLinks(supabase: SupabaseClient): Promise<NavigationLink[]> {
  const { data } = await supabase
    .from('navigation_links')
    .select('*')
    .order('display_order', { ascending: true });

  return (data ?? []) as NavigationLink[];
}

export async function getPublishedPageBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Page | null> {
  const { data } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  return data as Page | null;
}

export async function getAllPages(supabase: SupabaseClient): Promise<Page[]> {
  const { data } = await supabase
    .from('pages')
    .select('*')
    .order('display_order', { ascending: true });

  return (data ?? []) as Page[];
}

export async function createPage(
  supabase: SupabaseClient,
  page: Partial<Page>
): Promise<{ data: Page | null; error: string | null }> {
  const { data, error } = await supabase
    .from('pages')
    .insert(page)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Page, error: null };
}

export async function updatePage(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Page>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateNavigationLink(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<NavigationLink>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('navigation_links')
    .update(updates)
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function reorderNavigationLinks(
  supabase: SupabaseClient,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('navigation_links')
      .update({ display_order: i + 1 })
      .eq('id', orderedIds[i]);
    if (error) return { success: false, error: error.message };
  }
  return { success: true };
}
