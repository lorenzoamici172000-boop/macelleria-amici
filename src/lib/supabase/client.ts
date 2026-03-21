import { createClient as supabaseCreateClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function createClient() {
  if (client) return client;
  client = supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  return client;
}
