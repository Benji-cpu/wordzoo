import { signIn } from '@/lib/auth';
import { ImportOnboardingAfterAuth } from './import-onboarding';

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">🦁</h1>
        <h2 className="text-2xl font-bold mt-2">Create your WordZoo account</h2>
        <p className="text-text-secondary text-sm mt-1">
          Sign up to save your progress and unlock all features.
        </p>
      </div>
      <form
        action={async () => {
          'use server';
          await signIn('google');
        }}
      >
        <button
          type="submit"
          className="w-full rounded-xl bg-accent-default px-4 py-3 text-white font-medium hover:bg-accent-default/80 transition-colors"
        >
          Continue with Google
        </button>
      </form>
      <ImportOnboardingAfterAuth />
    </div>
  );
}
