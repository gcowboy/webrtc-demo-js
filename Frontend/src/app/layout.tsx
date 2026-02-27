import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import '@/app/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WebRTC Demo',
  description: 'Telnyx WebRTC Demo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={roboto.className}>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              {children}
            </TooltipProvider>
            <Toaster />
            {/* Required for toast() from 'sonner' used in Dialer, ClientOptions, etc. */}
            <SonnerToaster theme="light" position="top-center" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
