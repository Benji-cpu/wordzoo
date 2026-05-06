'use client';

import { useState } from 'react';
import Link from 'next/link';
import { daysUntil, clearTripState, type TripIntake } from '@/lib/onboarding/trip-state';
import type { TripPreviewResponse } from '@/lib/trip/types';

interface Props {
  intake: TripIntake;
  preview: TripPreviewResponse;
  onRestart: () => void;
}

export function TripPlanPreview({ intake, preview, onRestart }: Props) {
  const [unlocking, setUnlocking] = useState(false);
  const days = daysUntil(intake.tripStartDate);
  const totalWords = preview.scenes.reduce((acc, s) => acc + s.words.length, 0);

  function handleUnlock() {
    if (unlocking) return;
    setUnlocking(true);
    // Trip state is already in localStorage; commit page reads it post-auth.
    window.location.href = '/signup?return=/trip/commit';
  }

  function handleStartOver() {
    clearTripState();
    onRestart();
  }

  return (
    <div className="w-full max-w-lg mx-auto px-5 pb-32 pt-6 space-y-6">
      <div className="sticky top-3 z-10 mx-auto w-fit px-4 py-2 rounded-full bg-[color:var(--accent-indonesian)] text-white text-xs font-extrabold uppercase tracking-[0.16em] shadow-lg">
        {days > 0 ? `${days} days until Bali` : 'Trip is here!'}
      </div>

      <header className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-[color:var(--foreground)]">
          {preview.pathTitle}
        </h1>
        <p className="text-sm text-[color:var(--text-secondary)] font-medium leading-relaxed">
          {preview.pathDescription}
        </p>
        <p className="text-xs font-bold text-[color:var(--accent-indonesian)] uppercase tracking-[0.14em]">
          {totalWords} words · {preview.scenes.length} day{preview.scenes.length === 1 ? '' : 's'} of study
        </p>
      </header>

      <div className="space-y-4">
        {preview.scenes.map((scene, i) => {
          const isFree = i === 0;
          return (
            <article
              key={i}
              className={`rounded-3xl p-5 border-2 transition-all ${
                isFree
                  ? 'bg-[color:var(--card-surface)] border-[color:var(--accent-indonesian)]/30'
                  : 'bg-[color:var(--card-surface)] border-[color:var(--border)] relative overflow-hidden'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                  Day {i + 1}{isFree ? ' · free preview' : ''}
                </p>
                {!isFree && (
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[color:var(--accent-indonesian)]">
                    Locked
                  </span>
                )}
              </div>
              <h2 className="font-extrabold text-lg text-[color:var(--foreground)] mb-1">
                {scene.title}
              </h2>
              <p className="text-xs text-[color:var(--text-secondary)] mb-3 leading-relaxed">
                {scene.narrative}
              </p>
              <div className={isFree ? '' : 'blur-sm select-none pointer-events-none'}>
                <ul className="space-y-1.5">
                  {scene.words.map((w, j) => (
                    <li key={j} className="flex items-baseline gap-2 text-sm">
                      <span className="font-extrabold text-[color:var(--foreground)]">{w.text}</span>
                      {w.romanization && (
                        <span className="text-xs text-[color:var(--text-secondary)] italic">
                          {w.romanization}
                        </span>
                      )}
                      <span className="text-[color:var(--text-secondary)]">— {w.meaning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      <div className="rounded-3xl p-6 bg-[color:var(--accent-indonesian)] text-white space-y-4 text-center">
        <p className="font-extrabold text-lg leading-snug">
          You&rsquo;ll know {totalWords} Indonesian words by the time you land.
        </p>
        <p className="text-sm opacity-90 leading-relaxed">
          Mnemonics, audio, and review built in. One-time payment, yours forever.
        </p>
        <button
          type="button"
          onClick={handleUnlock}
          disabled={unlocking}
          className="w-full py-4 rounded-2xl font-extrabold text-base bg-white text-[color:var(--accent-indonesian)] disabled:opacity-60 active:scale-[0.98] transition-all"
        >
          {unlocking ? 'Continuing…' : 'Unlock my full plan — $4.99'}
        </button>
        <Link
          href="/login?return=/trip/commit"
          className="block text-xs font-bold opacity-80 underline-offset-2 hover:underline"
        >
          Already have an account? Sign in
        </Link>
      </div>

      <button
        type="button"
        onClick={handleStartOver}
        className="block mx-auto text-xs font-semibold text-[color:var(--text-secondary)] underline-offset-2 hover:underline"
      >
        Start over with different answers
      </button>
    </div>
  );
}
