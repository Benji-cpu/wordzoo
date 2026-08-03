'use client';

import type { PronunciationResult } from '@/types/audio';

/**
 * Shared mic chrome for every speaking surface.
 *
 * Lifted out of RepeatAfterMe so the drill's SpeakChallenge and the tutor-side
 * widget draw the same icon and, more importantly, the same score treatment.
 * The `not_scored` tone in particular must have exactly one definition — it is
 * deliberately colourless because we never heard the learner, so it is not a
 * verdict, and a second copy would eventually drift into looking like failure.
 */

export function MicIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="1" width="6" height="11" rx="3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export function ScoreDisplay({ result }: { result: PronunciationResult }) {
  const config: Record<PronunciationResult['score'], { icon: string; color: string; bg: string }> = {
    close_enough: { icon: '✓', color: 'text-green-400', bg: 'bg-green-500/20' },
    getting_there: { icon: '◐', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    try_again: { icon: '↻', color: 'text-orange-400', bg: 'bg-orange-500/20' },
    // Neutral on purpose — we never heard them, so this is not a verdict.
    not_scored: { icon: '–', color: 'text-text-secondary', bg: 'bg-surface-inset' },
  };
  const tone = config[result.score];

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${tone.bg}`}>
      <span className={`text-lg font-bold ${tone.color}`}>{tone.icon}</span>
      <span className={`text-sm ${tone.color}`}>{result.feedback}</span>
    </div>
  );
}
