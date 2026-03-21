import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (typeof window !== 'undefined') {
    const origWarn = console.warn;
    const origError = console.error;
    console.warn = (...args: any[]) => {
      if (args[0]?.toString?.().includes?.('lock')) return;
      origWarn.apply(console, args);
    };
    console.error = (...args: any[]) => {
      if (args[0]?.toString?.().includes?.('lock')) return;
      origError.apply(console, args);
    };
  }

  return browserClient;
}
