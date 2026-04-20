'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-4xl">⚠️</p>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-text-secondary">
          Sorry — we hit an unexpected error. Try again, and if it keeps happening, send us feedback.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center w-full min-h-[48px] rounded-lg bg-accent-default text-white font-semibold hover:brightness-110"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full min-h-[48px] rounded-lg border border-card-border text-foreground font-medium hover:bg-surface-inset"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
