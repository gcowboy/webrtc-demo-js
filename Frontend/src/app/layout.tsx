import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import '@/app/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'] });
const hasClerkPublishableKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const metadata: Metadata = {
  title: 'WebRTC Demo',
  description: 'Telnyx WebRTC Demo',
};

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
      {/* Required for toast() from 'sonner' used in Dialer, ClientOptions, etc. */}
      <SonnerToaster theme="light" position="top-center" />
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bodyContent = <AppProviders>{children}</AppProviders>;

  return (
    <html lang="en">
      <body className={roboto.className}>
        {hasClerkPublishableKey ? (
          <ClerkProvider>{bodyContent}</ClerkProvider>
        ) : (
          bodyContent
        )}
      </body>
    </html>
  );
}
