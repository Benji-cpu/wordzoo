'use client';

import { useEffect } from 'react';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { ActionCard, ActionCardRow } from '@/components/ui/ActionCard';
import { Celebration } from '@/components/ui/Celebration';
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
    <div className="flex flex-col items-stretch justify-center flex-1 min-h-[60vh] animate-spring-in relative pt-4 pb-6 gap-4">
      <Celebration active variant="scene-complete" />

      <EmptyStateCard
        foxPose="celebrating"
        title="All caught up!"
        subtitle={
          didRevision
            ? 'Great job reinforcing those tricky words — keep the habit going.'
            : 'Nice work on your reviews. The best time to learn a new word is right now.'
        }
        primary={{ label: 'Practice in conversation →', href: '/tutor?mode=word_review' }}
        secondary={{ label: 'Back to home', href: '/dashboard' }}
      />

      {sessionEarned > 0 && (
        <p className="self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--color-fox-soft)] text-[color:var(--color-fox-deep)] dark:text-[color:var(--color-fox-primary)] text-[13px] font-extrabold">
          <span aria-hidden>✨</span>
          +{sessionEarned} XP earned
        </p>
      )}

      <ActionCardRow>
        <ActionCard icon="🔁" value={totalReviewed} label="Reviewed" tone="cream" />
        <ActionCard icon="✓" value={correctCount} label="Remembered" tone="warm" />
      </ActionCardRow>

      {didRevision && (
        <>
          <p className="text-[10.5px] font-extrabold tracking-[0.16em] uppercase text-[color:var(--text-secondary)] px-1 -mb-2">
            Revision round
          </p>
          <ActionCardRow>
            <ActionCard icon="↻" value={revisionCount} label="Revised" tone="cream" />
            <ActionCard icon="✓" value={revisionCorrectCount} label="Recalled" tone="warm" />
          </ActionCardRow>
        </>
      )}
    </div>
  );
}
