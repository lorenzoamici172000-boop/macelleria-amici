import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        lock: {
          acquireLock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
            return await fn();
          },
          releaseLock: async () => {},
        } as any,
      },
    }
  );
  
  return client;
}
