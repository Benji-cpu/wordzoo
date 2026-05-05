'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { Celebration } from '@/components/ui/Celebration';
import { Fox } from '@/components/mascot/Fox';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { useXP, XP_AMOUNTS } from '@/lib/hooks/useXP';
import { fuzzyMatchAnswer } from '@/lib/pedagogy/normalize';
import { fireTelemetry } from '@/lib/pedagogy/telemetry';
import type { SupportedLanguageCode } from '@/types/audio';

interface ProductionTypingProps {
  /** English meaning shown as the prompt the learner translates from. */
  promptEn: string;
  /** Foreign-language target the learner must type. */
  correctTarget: string;
  targetLanguageCode?: SupportedLanguageCode;
  wordId: string;
  /** Optional pre-generated pronunciation; played on correct answer. */
  audioUrl?: string | null;
  onCorrect: () => void;
  /**
   * Fired on every submission (not just final). `attempts` counts how many
   * tries this word took (1-indexed: 1 = first try). `accuracy` is 'exact'
   * for distance-0 and 'close' for distance 1-2.
   */
  onAnswer?: (correct: boolean, attempts: number, accuracy?: 'exact' | 'close') => void;
}

const ALLOWED_EDITS = 2;

export function ProductionTyping({
  promptEn,
  correctTarget,
  wordId,
  audioUrl,
  onCorrect,
  onAnswer,
}: ProductionTypingProps) {
  const [typed, setTyped] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [closeMatch, setCloseMatch] = useState(false);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { play } = useSound();
  const { trigger } = useHaptic();
  const { award } = useXP();

  useEffect(() => {
    inputRef.current?.focus();
  }, [wordId]);

  const finalize = useCallback(
    (accuracy: 'exact' | 'close') => {
      if (done) return;
      setDone(true);
      setCelebrate(true);
      play('correct');
      trigger('success');
      void award('production_correct');
      fireTelemetry({
        event: 'production_correct',
        payload: { wordId, attempts: attempts + 1, accuracy },
      });
      onAnswer?.(true, attempts + 1, accuracy);
      setTimeout(onCorrect, 1100);
    },
    [done, play, trigger, award, wordId, attempts, onAnswer, onCorrect],
  );

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (done) return;
      const guess = typed;
      if (!guess.trim()) return;
      const result = fuzzyMatchAnswer(guess, correctTarget, ALLOWED_EDITS);
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (result.kind === 'exact') {
        finalize('exact');
        return;
      }
      if (result.kind === 'close') {
        setCloseMatch(true);
        finalize('close');
        return;
      }

      // Wrong
      play('incorrect');
      trigger('error');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      onAnswer?.(false, nextAttempts);
      fireTelemetry({
        event: 'production_wrong',
        payload: { wordId, attempts: nextAttempts, distance: result.distance },
      });

      if (nextAttempts === 1) {
        // First wrong: surface the first letter as a hint, clear input
        setHint(correctTarget.charAt(0));
        setTyped('');
        inputRef.current?.focus();
        return;
      }

      // Second wrong: reveal full answer; learner must type it correctly
      // to dismiss (typing-as-encoding).
      setRevealed(true);
      setHint(correctTarget);
      setTyped('');
      inputRef.current?.focus();
    },
    [typed, correctTarget, attempts, done, play, trigger, finalize, onAnswer, wordId],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTyped(e.target.value);
      // If we've revealed the answer and the learner has typed it correctly,
      // auto-finalize as a "transcription" pass (counts as production credit).
      if (revealed) {
        const result = fuzzyMatchAnswer(e.target.value, correctTarget, 0);
        if (result.kind === 'exact') {
          finalize('exact');
        }
      }
    },
    [revealed, correctTarget, finalize],
  );

  const inputDisabled = done;
  const buttonDisabled = done || typed.trim().length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center py-6 relative px-4">
        <p className="text-center text-[color:var(--text-secondary)] text-[13px] font-semibold mb-3">
          Type the word
        </p>
        <p
          className="text-center font-display text-[color:var(--color-fox-primary)] leading-tight"
          style={{ fontSize: 'clamp(1.75rem, 6vw, 2.5rem)' }}
        >
          {promptEn}
        </p>

        {hint && !revealed ? (
          <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
            Hint: starts with <span className="font-bold text-[color:var(--color-fox-primary)]">{hint}…</span>
          </p>
        ) : null}
        {revealed ? (
          <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
            Answer: <span className="font-bold text-[color:var(--color-fox-primary)]">{correctTarget}</span> · type it to continue
          </p>
        ) : null}
        {closeMatch && done ? (
          <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
            Close — exact spelling: <span className="font-bold text-[color:var(--color-fox-primary)]">{correctTarget}</span>
          </p>
        ) : null}

        {done ? (
          <div className="mt-5 flex items-center gap-2 animate-spring-in">
            <Fox pose="celebrating" size="sm" aria-label="Correct" />
            <PronunciationButton wordId={wordId} size={22} />
          </div>
        ) : null}

        <Celebration active={celebrate} variant="correct" />

        {done ? (
          <span
            aria-hidden
            className="absolute top-10 right-6 animate-xp-tick text-base font-bold text-[var(--color-fox-primary)]"
          >
            +{XP_AMOUNTS.production_correct} XP
          </span>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`pb-2 flex flex-col gap-3 ${shake ? 'animate-shake' : ''}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={handleChange}
          disabled={inputDisabled}
          inputMode="text"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Type your answer…"
          aria-label="Type the foreign-language word"
          className={`w-full rounded-xl border px-4 py-3 text-base bg-surface-inset border-card-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-default disabled:opacity-60 ${revealed && !done ? 'border-amber-500/60' : ''}`}
        />
        <button
          type="submit"
          disabled={buttonDisabled}
          className="rounded-xl bg-[color:var(--color-fox-primary)] text-white font-bold py-3 disabled:opacity-40 active:scale-[0.98] transition"
        >
          {revealed ? 'Type the answer above' : 'Check'}
        </button>
      </form>
    </div>
  );
}
