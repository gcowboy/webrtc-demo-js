'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// const clerkAppearance = {
//   variables: {
//     colorPrimary: 'var(--blue)',
//     colorBackground: 'var(--surface)',
//     colorText: 'var(--text)',
//     colorInputBackground: 'var(--surface)',
//     colorInputText: 'var(--text)',
//     borderRadius: '10px',
//   },
// };

export function DashboardAuth() {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: 'var(--blue)',
              colorBackground: 'var(--surface)',
              colorText: 'var(--text)',
              colorInputBackground: 'var(--surface)',
              colorInputText: 'var(--text)',
              borderRadius: '10px',
            },
          }}
          afterSignInUrl="/"
          signUpUrl="/sign-up"
        />
      </section>
    </main>
  );
}
