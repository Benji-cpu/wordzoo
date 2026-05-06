'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useHandsFreeSession } from '@/lib/audio/useHandsFreeSession';
import type { SessionSummary } from '@/types/audio';

interface SpeakingSessionProps {
  wordIds: string[];
  languageName: string;
  initialUsageSeconds: number;
  freeLimitSeconds: number;
  isPremium: boolean;
}

function formatPercent(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}

export function SpeakingSession({
  wordIds,
  languageName,
  initialUsageSeconds,
  freeLimitSeconds,
  isPremium,
}: SpeakingSessionProps) {
  const { session, start, pause, resume, stop } = useHandsFreeSession();
  const [started, setStarted] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [completing, setCompleting] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const completionPostedRef = useRef(false);

  const remainingSeconds = isPremium
    ? Number.POSITIVE_INFINITY
    : Math.max(0, freeLimitSeconds - initialUsageSeconds);

  function postCompletion(durationMs: number) {
    if (completionPostedRef.current) return;
    completionPostedRef.current = true;
    const seconds = Math.round(durationMs / 1000);
    setCompleting(true);
    fetch('/api/practice/speak/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationSeconds: seconds }),
    })
      .catch(() => {})
      .finally(() => setCompleting(false));
  }

  function handleStart() {
    if (wordIds.length === 0) return;
    startedAtRef.current = Date.now();
    setStarted(true);
    start(wordIds);
  }

  function handleStop() {
    const s = stop();
    if (s) {
      setSummary(s);
      postCompletion(s.duration);
    }
  }

  // Auto-finalize when the engine reports session_complete.
  useEffect(() => {
    if (session.state === 'session_complete' && !summary) {
      const summaryFromEngine = stop();
      if (summaryFromEngine) {
        setSummary(summaryFromEngine);
        postCompletion(summaryFromEngine.duration);
      }
    }
  }, [session.state, summary, stop]);

  // On unmount, cleanup + final flush
  useEffect(() => {
    return () => {
      const startedAt = startedAtRef.current;
      if (startedAt && !completionPostedRef.current) {
        postCompletion(Date.now() - startedAt);
      }
    };
  }, []);

  if (wordIds.length === 0) {
    return (
      <EmptyOrCapped
        title="Nothing to practice yet"
        body="Learn a few words first and they'll show up here for speaking practice."
        ctaHref="/dashboard"
        ctaLabel="Go to dashboard"
      />
    );
  }

  if (!isPremium && remainingSeconds <= 0) {
    return (
      <EmptyOrCapped
        title="You're out of speaking time today"
        body="Free tier gives 5 minutes of mic-on practice each day. Premium unlocks unlimited speaking."
        ctaHref="/pricing"
        ctaLabel="See premium"
        secondary={{ href: '/review', label: 'Review words instead' }}
      />
    );
  }

  if (summary) {
    const total = Math.max(1, summary.wordsAttempted);
    const great = summary.pronunciationScores.close_enough;
    const close = summary.pronunciationScores.getting_there;
    const tryAgain = summary.pronunciationScores.try_again;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--surface-inset)] p-5">
          <h2 className="text-xl font-extrabold mb-1">Session done</h2>
          <p className="text-sm text-[color:var(--text-secondary)]">
            {summary.wordsAttempted} word{summary.wordsAttempted === 1 ? '' : 's'} ·{' '}
            {Math.round(summary.duration / 1000)}s ·{' '}
            <span className="text-[color:var(--accent-indonesian)] font-bold">
              {formatPercent(great, total)} great
            </span>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <ScoreChip count={great} label="Great" tone="green" />
            <ScoreChip count={close} label="Almost" tone="amber" />
            <ScoreChip count={tryAgain} label="Retry" tone="red" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSummary(null);
              completionPostedRef.current = false;
              startedAtRef.current = null;
              setStarted(false);
            }}
            className="flex-1 min-h-[48px] rounded-xl bg-[var(--accent-indonesian)] text-white font-bold"
          >
            Practice again
          </button>
          <Link
            href="/review"
            className="flex-1 min-h-[48px] rounded-xl bg-[var(--surface-inset)] text-[color:var(--foreground)] font-semibold flex items-center justify-center"
          >
            Review words
          </Link>
        </div>
        {completing && (
          <p className="text-xs text-center text-[color:var(--text-secondary)]">Saving session…</p>
        )}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-[var(--surface-inset)] p-5">
          <h2 className="text-xl font-extrabold mb-1">Speaking practice</h2>
          <p className="text-sm text-[color:var(--text-secondary)] mb-3">
            We&apos;ll play a {languageName} word, then listen for you to repeat it. Tap start
            when you&apos;re ready and your mic permission is granted.
          </p>
          <ul className="text-sm text-[color:var(--foreground)] space-y-1.5 mb-4">
            <li>· {wordIds.length} words queued</li>
            <li>· About 60–90 seconds total</li>
            {!isPremium && (
              <li>
                ·{' '}
                <span className="text-[color:var(--text-secondary)]">
                  {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s of mic time left today
                </span>
              </li>
            )}
          </ul>
          <button
            onClick={handleStart}
            className="w-full min-h-[52px] rounded-xl bg-[var(--accent-indonesian)] text-white text-base font-bold"
          >
            Start speaking
          </button>
        </div>
        <p className="text-[11px] text-[color:var(--text-secondary)] text-center">
          Pronunciation grading uses your browser&apos;s speech recognition. Works best in Chrome
          on desktop or Safari on iOS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--surface-inset)] p-5 text-center">
        <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--text-secondary)] mb-2 font-extrabold">
          {session.currentWordIndex + 1} of {session.totalWords}
        </p>
        <p className="text-3xl font-extrabold leading-tight">
          {session.currentWord?.text ?? '—'}
        </p>
        {session.currentWord?.meaning && (
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">
            {session.currentWord.meaning}
          </p>
        )}
        <div className="mt-4 inline-flex rounded-full bg-[color:var(--accent-indonesian)]/10 text-[color:var(--accent-indonesian)] px-3 py-1 text-xs font-bold">
          {labelForState(session.state)}
        </div>
      </div>

      <div className="flex gap-2">
        {session.isPaused ? (
          <button
            onClick={resume}
            className="flex-1 min-h-[48px] rounded-xl bg-[var(--accent-indonesian)] text-white font-bold"
          >
            Resume
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex-1 min-h-[48px] rounded-xl bg-[var(--surface-inset)] text-[color:var(--foreground)] font-semibold"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleStop}
          className="flex-1 min-h-[48px] rounded-xl bg-[var(--surface-inset)] text-[color:var(--foreground)] font-semibold"
        >
          End session
        </button>
      </div>
    </div>
  );
}

function labelForState(state: string): string {
  switch (state) {
    case 'playing_word':
      return 'Listen…';
    case 'playing_mnemonic':
      return 'Hint…';
    case 'waiting_for_repeat':
      return 'Now you say it';
    case 'scoring':
      return 'Listening to you';
    case 'giving_feedback':
      return 'Feedback';
    case 'next_word':
      return 'Up next';
    case 'session_complete':
      return 'Done';
    default:
      return 'Get ready';
  }
}

function ScoreChip({ count, label, tone }: { count: number; label: string; tone: 'green' | 'amber' | 'red' }) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-rose-100 text-rose-700';
  return (
    <div className={`rounded-xl py-2 ${toneClass}`}>
      <div className="text-xl font-extrabold leading-none">{count}</div>
      <div className="text-[11px] font-bold uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

interface EmptyOrCappedProps {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  secondary?: { href: string; label: string };
}

function EmptyOrCapped({ title, body, ctaHref, ctaLabel, secondary }: EmptyOrCappedProps) {
  return (
    <div className="rounded-2xl bg-[var(--surface-inset)] p-5">
      <h2 className="text-xl font-extrabold mb-1">{title}</h2>
      <p className="text-sm text-[color:var(--text-secondary)] mb-4">{body}</p>
      <div className="flex gap-2">
        <Link
          href={ctaHref}
          className="flex-1 min-h-[48px] rounded-xl bg-[var(--accent-indonesian)] text-white font-bold flex items-center justify-center"
        >
          {ctaLabel}
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="flex-1 min-h-[48px] rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[color:var(--foreground)] font-semibold flex items-center justify-center"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}
