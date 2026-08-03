'use client';

import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';

interface DailyLimitReachedProps {
  /** The free-tier ceiling, so the copy names a real number. */
  limit: number;
  /** Server-supplied upgrade copy, when the 403 carried one. */
  message?: string | null;
  /** Words saved in this scene before the wall, if any. */
  savedThisScene?: number;
}

/**
 * The free-tier daily word wall.
 *
 * Rendered in place of the scene flow the moment the server refuses to record
 * another new word — never after, which is the whole point. Previously the 403
 * was swallowed by `.catch(() => {})` and the learner kept answering words that
 * were silently discarded, then got congratulated for all of them.
 *
 * A card rather than a modal: there is no modal primitive in components/ui, and
 * this is a terminal state for the session, not an interruption of it.
 *
 * The copy has to carry weight the layout can't. Because the scene is still the
 * atomic unit (20-32 words) while the free allowance is 5, the wall lands
 * mid-scene rather than at a clean boundary. Framing the stop as the correct
 * next move — consolidate what you just met — is the honest version of that,
 * and it happens to be true: reviewing five new words beats meeting a sixth.
 */
export function DailyLimitReached({ limit, message, savedThisScene }: DailyLimitReachedProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <EmptyStateCard
        foxPose="proud"
        title={`That's ${limit} for today`}
        subtitle={
          <>
            {savedThisScene !== undefined && savedThisScene > 0
              ? `You added ${savedThisScene} new ${savedThisScene === 1 ? 'word' : 'words'} here. `
              : ''}
            That&apos;s the free daily limit. They&apos;ll stick far better if you
            review them now than if you push on — this is a good place to stop.
          </>
        }
        primary={{ label: 'Review these now →', href: '/review' }}
        secondary={{ label: 'Back to home', href: '/dashboard' }}
      />
      <UpgradePrompt feature="new_word" message={message ?? undefined} />
    </div>
  );
}
