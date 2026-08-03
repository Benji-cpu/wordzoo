import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { TripContext, TripStatus } from '@/lib/services/trip-service';

interface GoalProgressCardProps {
  tripContext: TripContext;
}

const STATUS_EYEBROW: Record<TripStatus, string> = {
  none: 'Your goal',
  on_track: 'On track',
  ahead: 'Ahead of pace',
  slipping: 'A little behind',
  behind: 'Push pace',
  past: 'Trip done',
};

const STATUS_BAR: Record<TripStatus, string> = {
  none: 'var(--accent-indonesian)',
  on_track: '#22c55e',
  ahead: '#14b8a6',
  slipping: '#f59e0b',
  behind: '#f97316',
  past: '#8b5cf6',
};

/**
 * The headline the learner is actually chasing.
 *
 * Words used to be it, and it flattered: "mastered" meant interval >= 30 days,
 * reachable in about four self-graded taps with the mnemonic on screen. A
 * certified can-do is one communicative act that survived a delayed, unaided
 * production test — which is the thing someone means by "will I cope in Bali?".
 *
 * Words stay on as the secondary line; they were never a bad number, just a bad
 * headline.
 */
function headlineCaption(trip: TripContext): string {
  if (!trip.measuresCapability) {
    // No can-dos unlocked yet (no completed scenes), so fall back to words
    // rather than showing an empty bar that says nothing.
    if (trip.wordsRemaining === 0) return `Goal hit: ${trip.targetWordCount} words mastered ✓`;
    if (trip.paceNeeded !== null && trip.daysRemaining !== null && trip.daysRemaining > 0) {
      return `${trip.wordsMastered} of ${trip.targetWordCount} mastered · ~${trip.paceNeeded}/day to stay on track`;
    }
    return `${trip.wordsMastered} of ${trip.targetWordCount} words mastered`;
  }

  const base = `${trip.canDosCertified} of ${trip.canDosTotal} things you can do`;
  if (trip.status === 'past') return base;
  if (trip.daysRemaining === 0) return `${base} · today!`;
  if (trip.canDosCertified >= trip.canDosTotal) return `All ${trip.canDosTotal} certified ✓`;
  if (trip.paceNeeded !== null) return `${base} · ~${trip.paceNeeded}/day to stay on track`;
  return base;
}

function wordsSubCaption(trip: TripContext): string | null {
  if (!trip.measuresCapability) return null;
  return `${trip.wordsMastered} of ${trip.targetWordCount} words mastered`;
}

function tripTitle(trip: TripContext): string {
  if (trip.status === 'past') return `${trip.destination} — wrap-up`;
  if (trip.daysRemaining === 0) return `${trip.destination} — today`;
  const days = trip.daysRemaining ?? 0;
  const dayWord = days === 1 ? 'day' : 'days';
  return `${days} ${dayWord} to ${trip.destination}`;
}

export function GoalProgressCard({ tripContext }: GoalProgressCardProps) {
  if (!tripContext.hasTrip) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <div
            aria-hidden
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg"
            style={{ background: 'color-mix(in srgb, var(--accent-indonesian) 14%, transparent)' }}
          >
            🎯
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Set a learning goal</p>
            <p className="text-xs text-text-secondary mt-1">
              Pick a trip date and word target. We&apos;ll turn learning into a countdown so each day has a clear shape.
            </p>
            <Link
              href="/settings#trip"
              className="inline-block mt-3 text-sm font-semibold text-accent-default hover:underline"
            >
              Plan a trip →
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const progress = tripContext.measuresCapability
    ? Math.min(1, tripContext.canDosCertified / Math.max(1, tripContext.canDosTotal))
    : tripContext.targetWordCount > 0
      ? Math.min(1, tripContext.wordsMastered / tripContext.targetWordCount)
      : 0;
  const subCaption = wordsSubCaption(tripContext);
  const eyebrow = STATUS_EYEBROW[tripContext.status];
  const barColor = STATUS_BAR[tripContext.status];

  return (
    <Card>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[10px] font-extrabold tracking-[0.16em] uppercase text-text-secondary">
            {eyebrow}
          </div>
          <Link
            href="/settings#trip"
            className="text-[11px] font-semibold text-text-secondary hover:text-foreground"
          >
            Edit goal
          </Link>
        </div>
        <div className="text-[16px] font-extrabold leading-tight tracking-tight text-foreground">
          {tripTitle(tripContext)}
        </div>
        <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--surface-inset)' }}>
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progress * 100}%`, background: barColor }}
          />
        </div>
        <div className="text-[12px] font-medium text-text-secondary">
          {headlineCaption(tripContext)}
        </div>
        {subCaption && (
          <div className="text-[11px] text-text-secondary/80">{subCaption}</div>
        )}
      </div>
    </Card>
  );
}
