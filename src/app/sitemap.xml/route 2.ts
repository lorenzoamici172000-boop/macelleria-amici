import { createAdminSupabase } from '@/lib/supabase/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://macelleria-amici.netlify.app';

export async function GET() {
  const supabase = createAdminSupabase();

  const [productsRes, pagesRes] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('is_active', true),
    supabase.from('pages').select('slug, updated_at').eq('status', 'published'),
  ]);

  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/prodotti', priority: '0.9', changefreq: 'daily' },
    { path: '/recensioni', priority: '0.7', changefreq: 'weekly' },
    { path: '/chi-siamo', priority: '0.6', changefreq: 'monthly' },
    { path: '/contatti', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { path: '/cookie-policy', priority: '0.3', changefreq: 'yearly' },
  ];

  const productPages = (productsRes.data ?? []).map(p => ({
    path: `/prodotti/${p.slug}`,
    priority: '0.8',
    changefreq: 'daily',
    lastmod: p.updated_at,
  }));

  const dynamicPages = (pagesRes.data ?? [])
    .filter(p => !['chi-siamo', 'privacy-policy', 'cookie-policy'].includes(p.slug))
    .map(p => ({
      path: `/${p.slug}`,
      priority: '0.5',
      changefreq: 'weekly',
      lastmod: p.updated_at,
    }));

  const allPages = [...staticPages, ...productPages, ...dynamicPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${
      'lastmod' in page && page.lastmod
        ? `\n    <lastmod>${new Date(page.lastmod as string).toISOString().split('T')[0]}</lastmod>`
        : ''
    }
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
