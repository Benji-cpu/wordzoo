'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SceneSummary {
  id: string;
  title: string;
  description: string | null;
  totalWords: number;
  masteredWords: number;
}

interface Props {
  pathId: string;
  pathTitle: string;
  tripStartDate: string | null;
  tripDays: number;
  scenes: SceneSummary[];
  purchased: boolean;
  todayLabel: string;            // pre-computed on the server
  daysUntilTrip: number | null;  // null when trip is in the past
  showPurchaseToast?: boolean;
  showCanceledToast?: boolean;
}

function dayIndex(daysUntilTrip: number | null, tripDays: number): number {
  if (daysUntilTrip === null) return tripDays;
  // Day 1 starts when daysUntilTrip === tripDays - 1 (we begin study a few weeks ahead).
  // Simplest model: study Day N is currently min(scenes.length, max(1, scenes.length - daysUntilTrip + 1))
  // i.e. earlier days are "in the past" once you've passed them.
  return Math.max(0, tripDays - daysUntilTrip);
}

export function TripDashboard({
  pathId,
  pathTitle,
  tripStartDate,
  tripDays,
  scenes,
  purchased,
  todayLabel,
  daysUntilTrip,
  showPurchaseToast = false,
  showCanceledToast = false,
}: Props) {
  const [purchasing, setPurchasing] = useState(false);
  const total = scenes.length;
  const todayIdx = Math.min(total - 1, Math.max(0, dayIndex(daysUntilTrip, tripDays)));
  const todayScene = scenes[todayIdx] ?? null;
  const tripIsOver = daysUntilTrip === 0 && tripStartDate !== null;
  const tripDone = daysUntilTrip === null || (tripIsOver && todayIdx >= total - 1);

  async function handleBuy() {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/billing/travel-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pathId,
          successPath: `/trip/${pathId}?purchased=true`,
          cancelPath: `/trip/${pathId}?canceled=true`,
        }),
      });
      const json = (await res.json()) as { data: { url: string } | null; error: string | null };
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setPurchasing(false);
      }
    } catch {
      setPurchasing(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 pb-32 pt-6 space-y-6">
      {showPurchaseToast && (
        <div className="rounded-2xl bg-green-100 text-green-800 px-4 py-3 text-sm font-bold text-center">
          You&rsquo;re in. Your full Bali plan is unlocked.
        </div>
      )}
      {showCanceledToast && (
        <div className="rounded-2xl bg-amber-100 text-amber-800 px-4 py-3 text-sm font-medium text-center">
          Checkout canceled. You can still study Day 1 for free.
        </div>
      )}

      <header className="text-center space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
          {pathTitle}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[color:var(--foreground)]">
          {tripDone
            ? '🌴 Welcome back from Bali'
            : daysUntilTrip !== null
              ? `Day ${todayIdx + 1} of ${tripDays}`
              : `Day ${todayIdx + 1} of ${tripDays}`}
        </h1>
        {tripStartDate && (
          <p className="text-sm font-bold text-[color:var(--accent-indonesian)]">
            {daysUntilTrip !== null && daysUntilTrip > 0
              ? `${daysUntilTrip} days until your flight (${todayLabel})`
              : daysUntilTrip === 0
                ? `Travel day! (${todayLabel})`
                : `Trip ended (${todayLabel})`}
          </p>
        )}
      </header>

      {todayScene && !tripDone && (
        <section
          className={`rounded-3xl p-5 border-2 ${
            todayIdx === 0 || purchased
              ? 'border-[color:var(--accent-indonesian)]/40 bg-[color:var(--card-surface)]'
              : 'border-[color:var(--border)] bg-[color:var(--card-surface)]'
          }`}
        >
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
            Today
          </p>
          <h2 className="text-xl font-extrabold text-[color:var(--foreground)] mt-1 mb-1">
            {todayScene.title}
          </h2>
          {todayScene.description && (
            <p className="text-xs text-[color:var(--text-secondary)] mb-3 leading-relaxed">
              {todayScene.description}
            </p>
          )}
          <p className="text-xs font-semibold text-[color:var(--text-secondary)] mb-4">
            {todayScene.totalWords} word{todayScene.totalWords === 1 ? '' : 's'}
            {todayScene.masteredWords > 0 && ` · ${todayScene.masteredWords} mastered`}
          </p>
          {todayIdx === 0 || purchased ? (
            <Link
              href={`/learn/${todayScene.id}`}
              className="block w-full py-4 rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold text-center text-base active:scale-[0.98] transition-all"
            >
              Start today&rsquo;s lesson
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBuy}
              disabled={purchasing}
              className="block w-full py-4 rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold text-base disabled:opacity-60 active:scale-[0.98] transition-all"
            >
              {purchasing ? 'Loading…' : 'Unlock days 2+ — $4.99'}
            </button>
          )}
        </section>
      )}

      {tripDone && (
        <section className="rounded-3xl p-6 bg-[color:var(--card-surface)] border-2 border-[color:var(--accent-indonesian)]/30 space-y-3">
          <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
            Your Bali phrasebook
          </h2>
          <p className="text-xs text-[color:var(--text-secondary)] font-medium">
            Everything you learned, on one page. Save it to your phone.
          </p>
          <Link
            href={`/trip/${pathId}/phrasebook`}
            className="inline-block px-4 py-2 rounded-full bg-[color:var(--accent-indonesian)] text-white text-xs font-extrabold"
          >
            Open phrasebook →
          </Link>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--text-secondary)] px-1">
          Full plan
        </h3>
        <div className="space-y-2">
          {scenes.map((s, i) => {
            const isToday = i === todayIdx && !tripDone;
            const isLocked = !purchased && i > 0;
            const isComplete = s.totalWords > 0 && s.masteredWords >= s.totalWords;
            return (
              <div
                key={s.id}
                className={`rounded-2xl p-4 border-2 flex items-center justify-between gap-3 ${
                  isToday
                    ? 'border-[color:var(--accent-indonesian)] bg-[color:var(--card-surface)]'
                    : 'border-[color:var(--border)] bg-[color:var(--card-surface)]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">
                    Day {i + 1}
                    {isComplete && ' · ✓ done'}
                    {isLocked && ' · locked'}
                  </p>
                  <p className="text-sm font-extrabold text-[color:var(--foreground)] truncate">
                    {s.title}
                  </p>
                </div>
                {!isLocked && (
                  <Link
                    href={`/learn/${s.id}`}
                    className="px-3 py-2 rounded-full text-xs font-extrabold text-[color:var(--accent-indonesian)] hover:bg-[color:var(--accent-indonesian)]/10 transition-colors"
                  >
                    {isComplete ? 'Review' : 'Open'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
