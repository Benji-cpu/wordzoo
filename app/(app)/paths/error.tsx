'use client';

import { useEffect } from 'react';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';

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
    <div className="max-w-lg mx-auto flex flex-col justify-center min-h-[60vh] px-4">
      <EmptyStateCard
        foxPose="sad"
        title="Something went wrong"
        subtitle="Couldn't load learning paths. The network may be hiccuping — try again, or head back to your dashboard."
        primary={{ label: 'Try again', onClick: reset }}
        secondary={{ label: 'Back to dashboard', href: '/dashboard' }}
      />
    </div>
  );
}
