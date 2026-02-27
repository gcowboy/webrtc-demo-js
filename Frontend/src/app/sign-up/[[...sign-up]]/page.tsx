import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: 'hsl(var(--primary))',
            colorBackground: 'hsl(var(--card))',
            colorText: 'hsl(var(--card-foreground))',
            colorInputBackground: 'hsl(var(--background))',
            colorInputText: 'hsl(var(--foreground))',
            borderRadius: 'var(--radius)',
          },
        }}
        afterSignUpUrl="/"
        signInUrl="/sign-in"
      />
    </div>
  );
}
