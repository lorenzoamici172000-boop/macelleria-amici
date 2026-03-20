/**
 * Triggers cache revalidation after admin modifications.
 * Ensures all public pages reflect changes immediately.
 * 
 * This calls the /api/revalidate endpoint which uses Next.js
 * revalidatePath() to purge ISR cache on Netlify.
 */

const CRITICAL_PATHS = [
  '/',           // Home (hero, reviews preview)
  '/prodotti',   // Products listing
  '/recensioni', // Reviews
  '/chi-siamo',  // About
  '/contatti',   // Contacts
];

export async function revalidatePublicPages(
  additionalPaths?: string[]
): Promise<boolean> {
  try {
    const paths = [...CRITICAL_PATHS, ...(additionalPaths ?? [])];

    const response = await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    });

    if (!response.ok) {
      console.warn('[Revalidation] Failed:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    // Revalidation failure should never block admin operations
    console.warn('[Revalidation] Error:', error);
    return false;
  }
}

/**
 * Revalidate a specific dynamic page by slug
 */
export async function revalidatePage(slug: string): Promise<boolean> {
  return revalidatePublicPages([`/${slug}`]);
}

/**
 * Revalidate product pages
 */
export async function revalidateProducts(productSlug?: string): Promise<boolean> {
  const paths = ['/prodotti'];
  if (productSlug) paths.push(`/prodotti/${productSlug}`);
  return revalidatePublicPages(paths);
}

/**
 * Revalidate all settings-dependent pages
 */
export async function revalidateSettings(): Promise<boolean> {
  return revalidatePublicPages([
    '/privacy-policy',
    '/cookie-policy',
  ]);
}
