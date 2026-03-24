'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function PathsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Paths page error:', error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <p className="text-4xl mb-4">😵</p>
      <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
      <p className="text-text-secondary mb-6 text-center">
        Could not load learning paths. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
