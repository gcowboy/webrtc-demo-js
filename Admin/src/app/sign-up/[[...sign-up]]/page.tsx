'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <SignUp afterSignUpUrl="/" signInUrl="/sign-in" />
    </div>
  );
}
