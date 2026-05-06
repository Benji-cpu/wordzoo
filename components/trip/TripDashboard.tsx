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
  tripLabel: string;                  // e.g. "Mon, May 25" — empty when no trip date
  daysUntilTrip: number | null;       // null when no trip date set
  tripIsOver: boolean;
  studyDays: number;                  // total scenes available
  todayDayIndex: number;              // 0-based, today's study day
  scenes: SceneSummary[];
  purchased: boolean;
  showPurchaseToast?: boolean;
  showCanceledToast?: boolean;
}

export function TripDashboard({
  pathId,
  pathTitle,
  tripStartDate,
  tripLabel,
  daysUntilTrip,
  tripIsOver,
  studyDays,
  todayDayIndex,
  scenes,
  purchased,
  showPurchaseToast = false,
  showCanceledToast = false,
}: Props) {
  const [purchasing, setPurchasing] = useState(false);
  const todayScene = scenes[todayDayIndex] ?? null;

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

  const headlineCountdown =
    tripIsOver
      ? '🌴 Welcome back from Bali'
      : daysUntilTrip === null
        ? `Day ${todayDayIndex + 1} of ${studyDays}`
        : daysUntilTrip === 0
          ? 'Today is travel day'
          : `Day ${todayDayIndex + 1} of ${studyDays}`;

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
          {headlineCountdown}
        </h1>
        {tripStartDate && (
          <p className="text-sm font-bold text-[color:var(--accent-indonesian)]">
            {tripIsOver
              ? `Trip ended (${tripLabel})`
              : daysUntilTrip === 0
                ? `Travel day! (${tripLabel})`
                : `${daysUntilTrip} day${daysUntilTrip === 1 ? '' : 's'} until your flight (${tripLabel})`}
          </p>
        )}
      </header>

      {tripIsOver ? (
        <section className="rounded-3xl p-6 bg-[color:var(--card-surface)] border-2 border-[color:var(--accent-indonesian)]/30 space-y-3 text-center">
          <h2 className="text-lg font-extrabold text-[color:var(--foreground)]">
            Your Bali phrasebook
          </h2>
          <p className="text-sm text-[color:var(--text-secondary)] font-medium">
            Everything you learned, on one page. Save it to your phone.
          </p>
          <Link
            href={`/trip/${pathId}/phrasebook`}
            className="inline-block px-5 py-3 rounded-2xl bg-[color:var(--accent-indonesian)] text-white text-sm font-extrabold active:scale-[0.98]"
          >
            Open phrasebook →
          </Link>
        </section>
      ) : todayScene ? (
        <section className="rounded-3xl p-5 border-2 border-[color:var(--accent-indonesian)]/40 bg-[color:var(--card-surface)]">
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
          {todayDayIndex === 0 || purchased ? (
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
      ) : null}

      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
            Full plan
          </h3>
          {purchased && (
            <Link
              href={`/trip/${pathId}/phrasebook`}
              className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--accent-indonesian)] hover:underline"
            >
              Phrasebook →
            </Link>
          )}
        </div>
        <div className="space-y-2">
          {scenes.map((s, i) => {
            const isToday = i === todayDayIndex && !tripIsOver;
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
