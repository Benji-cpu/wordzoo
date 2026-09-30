'use client';

import { useEffect } from 'react';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { ActionCard, ActionCardRow } from '@/components/ui/ActionCard';
import { Celebration } from '@/components/ui/Celebration';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { useXP } from '@/lib/hooks/useXP';
import type { SittingSummary } from '@/lib/pedagogy/review-session';

interface ReviewCompleteProps {
  summary: SittingSummary;
  /** "Practice now" sittings are not due work: nothing is owed after them. */
  practice?: boolean;
  /** The scene this sitting was opened from ("Lock these in"), kept for another round. */
  sceneId?: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sittingsLabel(n: number): string {
  return n <= 1 ? 'about 1 sitting' : `about ${n} sittings`;
}

/**
 * How the sitting went, without flattery: what is locked in, what is parked
 * for next time, and how much is still waiting. "Next scene" is the main
 * button only when nothing fragile is left (see summarize); otherwise the main
 * button is another round.
 */
export function ReviewComplete({ summary, practice = false, sceneId = null }: ReviewCompleteProps) {
  const { play } = useSound();
  const { trigger } = useHaptic();
  const { award, sessionEarned } = useXP();
  const { lockedIn, parked, stillWaiting, sittings, total, canMoveOn } = summary;
  const celebrate = !practice && canMoveOn && stillWaiting === 0;

  useEffect(() => {
    if (celebrate) {
      play('scene-complete');
      trigger('celebrate');
    }
    if (total > 0) void award('review_session');
    // intentional: once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roundHref = sceneId && UUID.test(sceneId) ? `/review?scene=${sceneId}` : '/review';
  // Full navigation, not <Link>: a soft nav back to /review would keep this
  // mounted screen and never fetch the next sitting.
  const anotherRound = () => window.location.assign(roundHref);

  let title: string;
  let subtitle: string;
  if (practice) {
    title = 'Practice done';
    subtitle = `You went through ${total} ${total === 1 ? 'item' : 'items'}. Practice never changes your schedule.`;
  } else if (canMoveOn && stillWaiting === 0) {
    title = 'All caught up';
    subtitle = 'Everything due is locked in. A good time to learn something new.';
  } else if (canMoveOn) {
    title = 'Good place to stop';
    subtitle = `${stillWaiting} still waiting, ${sittingsLabel(sittings)}, but nothing shaky is holding you back.`;
  } else {
    title = 'Not locked in yet';
    subtitle =
      parked > 0
        ? `${parked} ${parked === 1 ? 'item is' : 'items are'} parked for next time. They stay due and come first.`
        : `${stillWaiting} still waiting, ${sittingsLabel(sittings)}. Another round keeps them coming back.`;
  }

  const primary = practice
    ? { label: 'Practice again', onClick: anotherRound }
    : canMoveOn
      ? { label: 'Next scene', href: '/dashboard' }
      : { label: 'Another round', onClick: anotherRound };
  const secondary = { label: 'Back to home', href: '/dashboard' };

  return (
    <div className="flex flex-col items-stretch justify-center flex-1 min-h-[60vh] animate-spring-in relative pt-4 pb-6 gap-4">
      {celebrate && <Celebration active variant="scene-complete" />}

      <EmptyStateCard
        foxPose={celebrate ? 'celebrating' : canMoveOn ? 'proud' : 'wave'}
        title={title}
        subtitle={subtitle}
        primary={primary}
        secondary={secondary}
      />

      {sessionEarned > 0 && (
        <p className="self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--color-fox-soft)] text-[color:var(--color-fox-deep)] dark:text-[color:var(--color-fox-primary)] text-[13px] font-extrabold">
          +{sessionEarned} XP earned
        </p>
      )}

      {!practice && (
        <ActionCardRow>
          <ActionCard icon="✓" value={`${lockedIn} of ${total}`} label="Locked in" tone="warm" />
          <ActionCard icon="⏸" value={parked} label="Parked for next time" tone="cream" />
          {stillWaiting > 0 && (
            <ActionCard icon="↻" value={stillWaiting} label={`Still waiting, ${sittingsLabel(sittings)}`} tone="neutral" />
          )}
        </ActionCardRow>
      )}
    </div>
  );
}
