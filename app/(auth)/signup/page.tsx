import { auth, signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ImportOnboardingAfterAuth } from './import-onboarding';

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-default/10 text-accent-default mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="w-8 h-8">
            <path d="M12 10 L16 18 L20 12 Z" fill="currentColor"/>
            <path d="M36 10 L32 18 L28 12 Z" fill="currentColor"/>
            <circle cx="19.5" cy="24" r="2" fill="currentColor"/>
            <circle cx="28.5" cy="24" r="2" fill="currentColor"/>
            <path d="M22.5 28.5 L24 30.5 L25.5 28.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20.5 32 Q24 35 27.5 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <h2 className="text-3xl font-bold">Create your WordZoo account</h2>
        <p className="text-text-secondary text-sm mt-1">
          Sign up to save your progress and unlock all features.
        </p>
      </div>
      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/dashboard' });
        }}
      >
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-card-border bg-card-surface px-4 py-3 font-medium text-foreground hover:border-accent-default/30 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </form>
      <div className="space-y-3">
        <p className="text-center text-xs text-text-secondary">
          By creating an account, you agree to our terms of service.
        </p>
        <div className="text-center">
          <Link href="/" className="text-sm text-text-secondary hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
      <ImportOnboardingAfterAuth />
    </div>
  );
}
