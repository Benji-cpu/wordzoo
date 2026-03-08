import { signIn } from '@/lib/auth';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Sign in to WordZoo</h1>
      <form
        action={async () => {
          'use server';
          await signIn('google');
        }}
      >
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
