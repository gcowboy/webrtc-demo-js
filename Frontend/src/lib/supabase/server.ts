import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Server-side Supabase client. Uses the current Clerk session token so
 * Supabase RLS and APIs see the authenticated user (Clerk is integrated in Supabase).
 * Use in Server Components, Route Handlers, and Server Actions.
 * Returns null if Supabase env vars are not set.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const { getToken } = await auth();
  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => (await getToken()) ?? null,
  });
}
