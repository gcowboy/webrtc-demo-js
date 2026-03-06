'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <SignIn afterSignInUrl="/" signUpUrl="/sign-up" />
    </div>
  );
}
