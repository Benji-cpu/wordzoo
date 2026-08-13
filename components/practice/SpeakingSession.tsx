'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import Link from 'next/link';
import { useHandsFreeSession } from '@/lib/audio/useHandsFreeSession';
import { LISTEN_TIMEOUT_MS } from '@/lib/audio/scoring';
import { MicIcon, Waveform } from '@/components/audio/mic-ui';
import type { HandsFreeState, SessionSummary } from '@/types/audio';

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
  const { session, micLevelRef, start, pause, resume, stop, replay } = useHandsFreeSession();
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
    const great = summary.pronunciationScores.close_enough;
    const close = summary.pronunciationScores.getting_there;
    const tryAgain = summary.pronunciationScores.try_again;
    const notScored = summary.pronunciationScores.not_scored;
    // Denominator is what we actually heard, NOT everything attempted. Dividing
    // by wordsAttempted meant a session where the mic never worked reported
    // "100% great" — every unscoreable attempt used to come back close_enough.
    const scored = great + close + tryAgain;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--surface-inset)] p-5">
          <h2 className="text-xl font-extrabold mb-1">Session done</h2>
          <p className="text-sm text-[color:var(--text-secondary)]">
            {summary.wordsAttempted} word{summary.wordsAttempted === 1 ? '' : 's'} ·{' '}
            {Math.round(summary.duration / 1000)}s
            {scored > 0 && (
              <>
                {' · '}
                <span className="text-[color:var(--accent-indonesian)] font-bold">
                  {formatPercent(great, scored)} great
                </span>
                {notScored > 0 && ` of ${scored} scored`}
              </>
            )}
          </p>
          {scored === 0 && (
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              We couldn&apos;t score this session — check mic access, or try a
              different browser. Nothing here counted against you.
            </p>
          )}
          {summary.error && (
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{summary.error}</p>
          )}
          <div
            className={`mt-4 grid gap-2 text-center ${
              notScored > 0 ? 'grid-cols-4' : 'grid-cols-3'
            }`}
          >
            <ScoreChip count={great} label="Great" tone="green" />
            <ScoreChip count={close} label="Almost" tone="amber" />
            <ScoreChip count={tryAgain} label="Retry" tone="red" />
            {notScored > 0 && <ScoreChip count={notScored} label="Not scored" tone="neutral" />}
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

  const listening = session.state === 'listening' && !session.isPaused;

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
        {/* Missing the word used to mean restarting the whole run to hear it
            again. Disabled while the mic is open, or the browser transcribes
            our own playback as the learner's attempt. */}
        <button
          type="button"
          onClick={replay}
          disabled={listening || !session.currentWord}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--background)] border border-[var(--card-border)] px-4 py-2 text-sm font-bold disabled:opacity-40"
        >
          <PlayIcon /> Hear it again
        </button>
      </div>

      <MicPanel
        listening={listening}
        state={session.state}
        paused={session.isPaused}
        levelRef={micLevelRef}
        deadline={session.listenDeadline}
      />

      {session.error && (
        <p className="text-xs text-center text-[color:var(--text-secondary)]">{session.error}</p>
      )}

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

/**
 * The recording indicator.
 *
 * Sized and coloured to be unmissable, because the only signal this screen used
 * to give was a small text chip — and that chip was wrong, reading "Feedback"
 * while the mic was open. Everything here keys off `listening`, which is now the
 * one state in which the microphone is actually recording.
 */
function MicPanel({
  listening,
  state,
  paused,
  levelRef,
  deadline,
}: {
  listening: boolean;
  state: HandsFreeState;
  paused: boolean;
  levelRef: RefObject<number>;
  deadline: number | null;
}) {
  return (
    <div
      className={`rounded-2xl p-5 transition-colors ${
        listening
          ? 'bg-red-500/10 ring-1 ring-red-500/40'
          : 'bg-[var(--surface-inset)]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`relative shrink-0 grid place-items-center w-14 h-14 rounded-full transition-colors ${
            listening
              ? 'bg-red-500 text-white'
              : 'bg-[var(--background)] text-[color:var(--text-secondary)]'
          }`}
        >
          {listening && (
            <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
          )}
          <span className="relative">
            <MicIcon size={24} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-bold ${
              listening ? 'text-red-400' : 'text-[color:var(--text-secondary)]'
            }`}
          >
            {paused ? 'Paused' : labelForState(state)}
          </p>
          <Waveform
            levelRef={levelRef}
            active={listening}
            className={`mt-2 block w-full h-8 ${
              listening ? 'text-red-400' : 'text-[color:var(--text-secondary)] opacity-30'
            }`}
          />
        </div>
      </div>
      <ListenCountdown deadline={listening ? deadline : null} />
    </div>
  );
}

/**
 * How long is left to speak.
 *
 * The listen window is a fixed 5s that closes silently, so someone who paused
 * to think just found their turn gone. Driven by a CSS transition keyed on the
 * deadline rather than a React timer — no re-render per frame, and a new window
 * restarts it because the key changed.
 */
function ListenCountdown({ deadline }: { deadline: number | null }) {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || !deadline) return;
    // Driven straight through the DOM rather than React state: it is one CSS
    // transition, and modelling it as state costs a render to reset the width
    // and another to start it. The reset also has to land as its own style
    // commit, or the browser coalesces the two and the bar never moves — two
    // frames apart is what makes it animate.
    bar.style.transition = 'none';
    bar.style.width = '100%';
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        bar.style.transition = `width ${LISTEN_TIMEOUT_MS}ms linear`;
        bar.style.width = '0%';
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [deadline]);

  if (!deadline) return null;

  return (
    <div className="mt-3 h-1 rounded-full bg-red-500/20 overflow-hidden">
      <div ref={barRef} className="h-full rounded-full bg-red-400" style={{ width: '100%' }} />
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

function labelForState(state: HandsFreeState): string {
  switch (state) {
    case 'playing_word':
      return 'Listen…';
    case 'playing_mnemonic':
      return 'Hint…';
    case 'waiting_for_repeat':
      return 'Get ready to say it';
    case 'listening':
      // The only label that promises recording, on the only state that does it.
      return 'Speak now — recording';
    case 'scoring':
      return 'Checking what we heard';
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

function ScoreChip({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: 'green' | 'amber' | 'red' | 'neutral';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : tone === 'red'
      ? 'bg-rose-100 text-rose-700'
      // Deliberately colourless: "not scored" is neither a win nor a failure.
      : 'bg-[var(--surface-inset)] text-[color:var(--text-secondary)]';
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
