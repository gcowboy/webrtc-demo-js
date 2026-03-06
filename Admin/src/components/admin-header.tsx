'use client';

import { useRouter, usePathname } from 'next/navigation';
import { getAdminToken, clearAdminToken } from '@/lib/admin-auth';
import { useEffect, useState } from 'react';

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getAdminToken()));
  }, [pathname]);

  function handleSignOut() {
    clearAdminToken();
    setHasToken(false);
    router.push('/sign-in');
    router.refresh();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return (
    <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Admin
        </h1>
        <div className="flex items-center gap-4">
          {hasToken ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-[hsl(var(--primary))] hover:underline"
            >
              Sign out
            </button>
          ) : null}
          {appUrl ? (
            <a
              href={appUrl}
              className="text-sm text-[hsl(var(--primary))] hover:underline"
            >
              ← Back to app
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
