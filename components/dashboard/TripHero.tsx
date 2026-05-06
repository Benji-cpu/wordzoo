'use client';

import Link from 'next/link';
import type { TripContext, TripStatus } from '@/lib/services/trip-service';

interface TripHeroProps {
  trip: TripContext;
  ctaHref: string;
  ctaLabel?: string;
}

const STATUS_TONE: Record<TripStatus, { gradient: string; ink: string; eyebrow: string }> = {
  none:     { gradient: 'linear-gradient(135deg,#475569,#64748b)', ink: '#1e293b', eyebrow: '' },
  on_track: { gradient: 'linear-gradient(135deg,#16a34a,#22c55e)', ink: '#14532d', eyebrow: 'On track' },
  ahead:    { gradient: 'linear-gradient(135deg,#0d9488,#14b8a6)', ink: '#134e4a', eyebrow: 'Ahead of pace' },
  slipping: { gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', ink: '#78350f', eyebrow: 'A little behind' },
  behind:   { gradient: 'linear-gradient(135deg,#dc2626,#f97316)', ink: '#7f1d1d', eyebrow: 'Push pace' },
  past:     { gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', ink: '#312e81', eyebrow: 'Trip done' },
};

function formatTripDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TripHero({ trip, ctaHref, ctaLabel = 'Resume session' }: TripHeroProps) {
  if (!trip.hasTrip || !trip.tripDate || trip.daysRemaining === null) return null;

  const tone = STATUS_TONE[trip.status];
  const days = trip.daysRemaining;
  const progress = trip.targetWordCount > 0
    ? Math.min(1, trip.wordsMastered / trip.targetWordCount)
    : 0;

  let title: string;
  let subtitle: string;

  if (trip.status === 'past') {
    title = `${trip.destination} — how was it?`;
    subtitle = `${trip.wordsMastered} of ${trip.targetWordCount} words mastered. Plan your next trip?`;
  } else if (days === 0) {
    title = `${trip.destination} — today!`;
    subtitle = `${trip.wordsMastered} of ${trip.targetWordCount} words mastered. Have a great trip.`;
  } else {
    const dayWord = days === 1 ? 'day' : 'days';
    title = `${days} ${dayWord} until ${trip.destination}`;
    if (trip.wordsRemaining === 0) {
      subtitle = `Goal hit: ${trip.targetWordCount} words mastered ✓`;
    } else if (trip.paceNeeded !== null) {
      subtitle = `${trip.wordsMastered} of ${trip.targetWordCount} mastered · ~${trip.paceNeeded}/day to stay on track`;
    } else {
      subtitle = `${trip.wordsMastered} of ${trip.targetWordCount} words mastered`;
    }
  }

  const dateLabel = formatTripDate(trip.tripDate);

  return (
    <Link
      href={ctaHref}
      aria-label={`Trip countdown: ${title}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-active)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded-[22px] active:scale-[0.99] transition-transform"
    >
      <div
        className="relative overflow-hidden rounded-[22px] p-[18px] shadow-[0_8px_20px_rgba(15,23,42,0.18)]"
        style={{ background: tone.gradient }}
      >
        <div aria-hidden className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10 bg-white" />
        <div aria-hidden className="absolute -bottom-8 left-1/3 w-20 h-20 rounded-full opacity-10 bg-white" />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-extrabold tracking-[0.18em] uppercase opacity-90 text-white">
              {tone.eyebrow || 'Your trip'} · {dateLabel}
            </div>
          </div>
          <div className="text-[20px] font-extrabold leading-tight tracking-tight text-white mb-0.5">
            {title}
          </div>
          <div className="text-[12.5px] font-semibold opacity-90 mb-3.5 text-white">{subtitle}</div>
          <div className="h-[5px] bg-white/30 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-white rounded-full transition-[width] duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold tracking-wide text-white">{ctaLabel}</span>
            <span
              aria-hidden
              className="w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center font-black text-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
              style={{ color: tone.ink }}
            >
              ›
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
