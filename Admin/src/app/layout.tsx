import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster as SonnerToaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Admin dashboard',
};

function AdminHeader() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return (
    <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">
          Admin
        </h1>
        {appUrl ? (
          <a
            href={appUrl}
            className="text-sm text-[hsl(var(--primary))] hover:underline"
          >
            ← Back to app
          </a>
        ) : null}
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[hsl(var(--background))]">
        {hasClerkKey ? (
          <ClerkProvider>
            <AdminHeader />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
            <SonnerToaster theme="light" position="top-center" />
          </ClerkProvider>
        ) : (
          <>
            <AdminHeader />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
            <SonnerToaster theme="light" position="top-center" />
          </>
        )}
      </body>
    </html>
  );
}
