import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
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
