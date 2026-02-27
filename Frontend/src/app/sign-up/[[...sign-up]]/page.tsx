import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="auth-layout">
      <section className="auth-card">
        <SignUp
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
          afterSignUpUrl="/"
          signInUrl="/sign-in"
        />
      </section>
    </main>
  );
}
