'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--blue)',
    colorBackground: 'var(--surface)',
    colorText: 'var(--text)',
    colorInputBackground: 'var(--surface)',
    colorInputText: 'var(--text)',
    borderRadius: '10px',
  },
};

export function DashboardAuth() {
  return (
    <main className="auth-layout">
      <section className="auth-card dashboard-auth-card">
        <div className="dashboard-auth-header">
          <h1>Telnyx WebRTC Demo</h1>
          <p>Sign in to your account or create a new one to get started.</p>
        </div>
        <Tabs defaultValue="sign-in" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
            <TabsTrigger value="sign-up">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in">
            <SignIn
              appearance={clerkAppearance}
              afterSignInUrl="/"
              signUpUrl="/sign-up"
            />
          </TabsContent>
          <TabsContent value="sign-up">
            <SignUp
              appearance={clerkAppearance}
              afterSignUpUrl="/"
              signInUrl="/sign-in"
            />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
