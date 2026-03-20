import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Cache revalidation endpoint.
 * Called by admin pages after saving changes to ensure
 * ISR-cached public pages reflect updates immediately.
 * 
 * This endpoint only purges cache — it doesn't expose or modify data.
 * Rate limiting is handled by Netlify/hosting level.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paths, tags } = body as { paths?: string[]; tags?: string[] };

    if (paths) {
      for (const path of paths) {
        try { revalidatePath(path); } catch { /* path may not exist */ }
      }
    }

    if (tags) {
      for (const tag of tags) {
        try { revalidateTag(tag); } catch { /* tag may not exist */ }
      }
    }

    // Always revalidate the root layout (navbar, footer, theme)
    try { revalidatePath('/', 'layout'); } catch {}

    return NextResponse.json({ revalidated: true, timestamp: Date.now() });
  } catch (error) {
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
