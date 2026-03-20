import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin/dashboard') ||
      request.nextUrl.pathname.startsWith('/admin/prodotti') ||
      request.nextUrl.pathname.startsWith('/admin/ordini') ||
      request.nextUrl.pathname.startsWith('/admin/pagine') ||
      request.nextUrl.pathname.startsWith('/admin/categorie') ||
      request.nextUrl.pathname.startsWith('/admin/recensioni') ||
      request.nextUrl.pathname.startsWith('/admin/statistiche') ||
      request.nextUrl.pathname.startsWith('/admin/impostazioni') ||
      request.nextUrl.pathname.startsWith('/admin/media')) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Protect authenticated user routes
  const protectedPaths = ['/account', '/i-miei-ordini', '/preferiti', '/checkout', '/carrello'];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
