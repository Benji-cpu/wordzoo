'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { Celebration } from '@/components/ui/Celebration';
import { Fox } from '@/components/mascot/Fox';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { useXP } from '@/lib/hooks/useXP';

interface ReviewCompleteProps {
  totalReviewed: number;
  correctCount: number;
  revisionCount?: number;
  revisionCorrectCount?: number;
}

export function ReviewComplete({
  totalReviewed,
  correctCount,
  revisionCount = 0,
  revisionCorrectCount = 0,
}: ReviewCompleteProps) {
  const router = useRouter();
  const didRevision = revisionCount > 0;
  const { play } = useSound();
  const { trigger } = useHaptic();
  const { award, sessionEarned } = useXP();

  useEffect(() => {
    play('scene-complete');
    trigger('celebrate');
    if (totalReviewed > 0) void award('review_session');
    // intentional: award once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] animate-spring-in relative">
      <Celebration active variant="scene-complete" />
      <Fox pose="celebrating" size="lg" aria-label="Review complete" />
      <h2 className="text-2xl font-bold text-foreground mb-1 mt-2">All caught up!</h2>
      <p className="text-text-secondary mb-4 text-center max-w-xs">
        {didRevision
          ? 'Great job reinforcing those tricky words!'
          : 'Nice work on your reviews.'}
      </p>

      {sessionEarned > 0 ? (
        <p className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-fox-soft)] text-[var(--color-fox-deep)] dark:text-[var(--color-fox-primary)] text-sm font-semibold">
          <span aria-hidden>✨</span>
          +{sessionEarned} XP earned
        </p>
      ) : null}

      <Card className="w-full max-w-xs mb-4">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{totalReviewed}</p>
            <p className="text-xs text-text-secondary">Reviewed</p>
          </div>
          <div className="w-px bg-card-border" />
          <div>
            <p className="text-2xl font-bold text-[var(--color-success)]">{correctCount}</p>
            <p className="text-xs text-text-secondary">Remembered</p>
          </div>
        </div>
      </Card>

      {didRevision && (
        <Card className="w-full max-w-xs mb-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider text-center mb-3">
            Revision Round
          </p>
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{revisionCount}</p>
              <p className="text-xs text-text-secondary">Revised</p>
            </div>
            <div className="w-px bg-card-border" />
            <div>
              <p className="text-2xl font-bold text-[var(--color-success)]">{revisionCorrectCount}</p>
              <p className="text-xs text-text-secondary">Recalled</p>
            </div>
          </div>
        </Card>
      )}

      <Link
        href="/tutor?mode=word_review"
        className="block w-full max-w-xs rounded-xl bg-accent-default/5 border border-accent-default/15 p-4 hover:bg-accent-default/10 transition-colors mb-3"
      >
        <div className="flex items-center gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-default flex-shrink-0"
          >
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-foreground">Practice in Conversation</p>
            <p className="text-xs text-text-secondary">Use your reviewed words in a chat</p>
          </div>
        </div>
      </Link>

      <div className="w-full max-w-xs">
        <ThumbButton
          onClick={() => router.push('/dashboard')}
          size="md"
          variant="primary"
        >
          Back to Dashboard
        </ThumbButton>
      </div>
    </div>
  );
}
