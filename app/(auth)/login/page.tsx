import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">🦁</h1>
        <h2 className="text-2xl font-bold mt-2">Sign in to WordZoo</h2>
        <p className="text-sm text-text-secondary mt-1">Welcome back — let&apos;s keep learning.</p>
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
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
