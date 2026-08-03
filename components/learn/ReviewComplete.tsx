'use client';

import { useEffect } from 'react';
import Link from 'next/link';
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
  reviewedWordIds?: string[];
  otherLanguagesDue?: { code: string; name: string; count: number }[];
  /**
   * Items still due that this sitting didn't reach (the queue is capped at 20
   * words + 20 phrases). Greater than zero means this is NOT the end of the
   * work, and the screen must not say or celebrate otherwise.
   */
  remaining?: number;
}

export function ReviewComplete({
  totalReviewed,
  correctCount,
  revisionCount = 0,
  revisionCorrectCount = 0,
  reviewedWordIds = [],
  otherLanguagesDue = [],
  remaining = 0,
}: ReviewCompleteProps) {
  const didRevision = revisionCount > 0;
  const moreWaiting = remaining > 0;
  // Carry the just-reviewed words into the tutor so the word_review session
  // practices them instead of the (now empty) due queue
  const tutorHref = reviewedWordIds.length > 0
    ? `/tutor?mode=word_review&words=${reviewedWordIds.slice(0, 10).join(',')}`
    : '/tutor?mode=word_review';
  const { play } = useSound();
  const { trigger } = useHaptic();
  const { award, sessionEarned } = useXP();

  useEffect(() => {
    // Confetti and a fanfare for clearing 20 of 148 is the dishonesty the
    // learner reported as "it doesn't say I'm done, it just restarts". Only
    // celebrate an actually-empty queue. The XP is still earned either way —
    // they did the work.
    if (!moreWaiting) {
      play('scene-complete');
      trigger('celebrate');
    }
    if (totalReviewed > 0) void award('review_session');
    // intentional: award once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-stretch justify-center flex-1 min-h-[60vh] animate-spring-in relative pt-4 pb-6 gap-4">
      {!moreWaiting && <Celebration active variant="scene-complete" />}

      {moreWaiting ? (
        <EmptyStateCard
          foxPose="wave"
          title={`${remaining} more waiting`}
          subtitle={
            <>
              You cleared {totalReviewed}. Reviews come in batches of 20 so a
              sitting stays under a couple of minutes — keep going, or come back
              to the rest later.
            </>
          }
          primary={{
            label: `Review ${Math.min(remaining, 20)} more →`,
            // Full navigation, not <Link>. A soft nav back to /review keeps the
            // mounted ReviewClient — including phase='done' — so the learner
            // would just land back on this same screen.
            onClick: () => window.location.assign('/review'),
          }}
          secondary={{ label: 'Back to home', href: '/dashboard' }}
        />
      ) : (
        <EmptyStateCard
          foxPose="celebrating"
          title="All caught up!"
          subtitle={
            didRevision
              ? 'Great job reinforcing those tricky words — keep the habit going.'
              : 'Nice work on your reviews. The best time to learn a new word is right now.'
          }
          primary={{ label: 'Practice in conversation →', href: tutorHref }}
          secondary={{ label: 'Back to home', href: '/dashboard' }}
        />
      )}

      {otherLanguagesDue.length > 0 && (
        <Link
          href="/settings"
          className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 text-[13px] font-semibold text-[color:var(--foreground)] active:scale-[0.99] transition-transform"
        >
          {otherLanguagesDue.map((o) => `${o.count} in ${o.name}`).join(' · ')} still waiting —
          switch your learning language to review them ›
        </Link>
      )}

      {sessionEarned > 0 && (
        <p className="self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--color-fox-soft)] text-[color:var(--color-fox-deep)] dark:text-[color:var(--color-fox-primary)] text-[13px] font-extrabold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m12 3 1.9 5.6L20 11l-6.1 2.4L12 19l-1.9-5.6L4 11l6.1-2.4Z" />
          </svg>
          +{sessionEarned} XP earned
        </p>
      )}

      <ActionCardRow>
        <ActionCard icon="↻" value={totalReviewed} label="Reviewed" tone="cream" />
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
