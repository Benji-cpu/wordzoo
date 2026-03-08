import { signIn } from '@/lib/auth';

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Create your WordZoo account</h1>
      <p className="text-center text-gray-600">
        Sign up to save your progress and unlock all features.
      </p>
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
          Continue with Google
        </button>
      </form>
    </div>
  );
}
