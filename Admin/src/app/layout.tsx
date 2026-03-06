import type { Metadata } from 'next';
import './globals.css';
import { Toaster as SonnerToaster } from 'sonner';
import { AdminHeader } from '@/components/admin-header';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Admin dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[hsl(var(--background))]">
        <AdminHeader />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <SonnerToaster theme="light" position="top-center" />
      </body>
    </html>
  );
}
