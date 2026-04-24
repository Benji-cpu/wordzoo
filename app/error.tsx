'use client';

import { useEffect } from 'react';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';

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
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[color:var(--background)] text-[color:var(--foreground)] p-6">
      <div className="max-w-md w-full">
        <EmptyStateCard
          foxPose="sad"
          title="Something went wrong"
          subtitle="Sorry — we hit an unexpected error. Try again, and if it keeps happening, send us feedback."
          primary={{ label: 'Try again', onClick: reset }}
          secondary={{ label: 'Back to dashboard', href: '/dashboard' }}
        />
      </div>
    </div>
  );
}
