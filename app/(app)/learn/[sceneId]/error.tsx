'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { emitDiag } from '@/lib/feedback/diag';

/**
 * Scene-level error boundary. A render error inside the scene flow used to
 * fall through to /app/error.tsx with a generic Fox screen — and a silent
 * `null` return inside DrillBlock / Cloze rendered as pure blank with no
 * recovery. This boundary catches both, sends a diag breadcrumb to the
 * activity-trail (so it lands in the next feedback row), and gives the
 * user a Reload button instead of a dead-end.
 */
export default function SceneError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[scene error boundary]', error);
    emitDiag(`scene crash: ${error.message ?? 'unknown'}`);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <EmptyStateCard
          foxPose="sad"
          title="That exercise hit a snag"
          subtitle="Sorry — the scene crashed mid-flow. Reload to pick up where you left off, or head back to your path."
          primary={{ label: 'Reload scene', onClick: reset }}
          secondary={{ label: 'Back to dashboard', href: '/dashboard' }}
        />
        <p className="mt-4 text-center text-xs text-[color:var(--text-secondary)]">
          Tap the feedback button if this keeps happening — the activity trail will tell us why.
        </p>
        <p className="mt-2 text-center text-xs text-[color:var(--text-secondary)]">
          Or go to <Link href="/paths" className="underline">Paths</Link>.
        </p>
      </div>
    </div>
  );
}
