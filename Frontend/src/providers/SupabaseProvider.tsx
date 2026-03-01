'use client';

import { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createBrowserSupabaseClient, createAnonSupabaseClient } from '@/lib/supabase/client';

const SupabaseContext = createContext<SupabaseClient | null>(null);

const hasSupabaseEnv =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Provides a Supabase client that uses the current Clerk session token.
 * Must be rendered inside ClerkProvider. When Clerk or Supabase env is missing,
 * provides an anonymous client or null so callers can guard.
 */
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();

  const supabase = useMemo(() => {
    if (!hasSupabaseEnv) return null;
    if (isSignedIn && getToken) {
      return createBrowserSupabaseClient(async () => (await getToken()) ?? null);
    }
    return createAnonSupabaseClient();
  }, [getToken, isSignedIn]);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase(): SupabaseClient | null {
  const client = useContext(SupabaseContext);
  return client ?? null;
}
