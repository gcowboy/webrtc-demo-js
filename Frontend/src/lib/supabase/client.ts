import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Creates a browser Supabase client that uses the provided token getter
 * (e.g. from Clerk's useAuth().getToken). Use via SupabaseProvider / useSupabase.
 */
export function createBrowserSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: getToken,
  });
}

/**
 * Creates an unauthenticated browser client (e.g. for public data when not signed in).
 * Prefer useSupabase() when inside SupabaseProvider so RLS uses the Clerk user.
 */
export function createAnonSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}
