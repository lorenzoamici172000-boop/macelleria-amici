import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://macelleria-amici.netlify.app';
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/prodotti`, lastModified: new Date() },
    { url: `${base}/chi-siamo`, lastModified: new Date() },
    { url: `${base}/contatti`, lastModified: new Date() },
    { url: `${base}/recensioni`, lastModified: new Date() },
  ];
}
