'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Celebration } from '@/components/ui/Celebration';
import { Fox } from '@/components/mascot/Fox';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { useXP, XP_AMOUNTS } from '@/lib/hooks/useXP';
import { fuzzyMatchAnswer } from '@/lib/pedagogy/normalize';
import { fireTelemetry } from '@/lib/pedagogy/telemetry';
import { useViewportInsets } from '@/lib/hooks/useKeyboardVisible';
import type { ClozePhraseForWord } from '@/lib/db/queries';

interface ClozeProps {
  /** The target word the learner must produce. */
  correctTarget: string;
  wordId: string;
  /** Phrases containing the target word. The first is used; others are kept for future randomisation. */
  phrases: ClozePhraseForWord[];
  /** English meaning of the target word, used as a hint after a wrong attempt. */
  meaningEn?: string | null;
  onCorrect: () => void;
  /**
   * Fired once, when the item resolves. A learner who needed the answer shown
   * resolves as `onAnswer(false, REVEAL_ATTEMPTS)` and never fires `onCorrect`
   * — the call site's wrong-handling is what advances the drill. See
   * `resolveRevealed`.
   */
  onAnswer?: (correct: boolean, attempts: number) => void;
}

const BLANK = '_____';

/**
 * Attempts reported when the learner needed the answer shown — either they
 * burned both tries or they pressed "I don't remember". Mirrors
 * ProductionTyping so both typed cues report the same way.
 */
const REVEAL_ATTEMPTS = 2;

/**
 * Render a phrase from the same scene with the target word blanked out.
 * The learner types the missing word; we fuzzy-match (accent-insensitive,
 * with a length-scaled typo tolerance — see `allowedEditsFor`). Wrong →
 * reveal English meaning as hint, retry. Wrong twice, or "I don't remember" →
 * reveal the full word, type it to lock it in (or continue).
 */
export function Cloze({
  correctTarget,
  wordId,
  phrases,
  meaningEn,
  onCorrect,
  onAnswer,
}: ClozeProps) {
  const phrase = phrases[0] ?? null;
  const [typed, setTyped] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { play } = useSound();
  const { trigger } = useHaptic();
  const { award } = useXP();
  const { keyboardHeight } = useViewportInsets();

  // Build the visible cloze: replace the target word in text_target with a blank
  // (case-insensitive, word-boundary aware where possible).
  const cloze = useMemo(() => {
    if (!phrase) return { before: '', after: '', whole: '' };
    const target = phrase.word_text;
    const idx = phrase.text_target.toLowerCase().indexOf(target.toLowerCase());
    if (idx < 0) {
      return { before: phrase.text_target + ' ', after: '', whole: phrase.text_target };
    }
    return {
      before: phrase.text_target.slice(0, idx),
      after: phrase.text_target.slice(idx + target.length),
      whole: phrase.text_target,
    };
  }, [phrase]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [wordId]);

  const finalize = useCallback(() => {
    if (done) return;
    setDone(true);
    setPassed(true);
    setCelebrate(true);
    play('correct');
    trigger('success');
    void award('cloze_correct');
    fireTelemetry({
      event: 'cloze_correct',
      payload: { wordId, attempts: attempts + 1 },
    });
    onAnswer?.(true, attempts + 1);
    setTimeout(onCorrect, 1100);
  }, [done, play, trigger, award, wordId, attempts, onAnswer, onCorrect]);

  /** Show the answer in the blank and switch to type-it-to-continue. */
  const reveal = useCallback(() => {
    setRevealed(true);
    setTyped('');
    play('reveal');
    inputRef.current?.focus();
  }, [play]);

  /**
   * The learner has seen the answer and is moving on. Report the miss NOW —
   * not when the answer was revealed.
   *
   * Both call sites (DrillBlock, PhraseDrillBlock) react to any
   * `onAnswer(false, …)` by calling `applyWrong`, which re-keys this component
   * and remounts it. Reporting a wrong the moment it happened meant neither the
   * meaning hint nor the reveal ever reached the screen: the item silently
   * re-queued and came back at attempt 0, so a learner who didn't know the word
   * could cycle on it indefinitely with no way to find out what it was.
   *
   * No XP and no `onCorrect`: transcribing an answer you were just shown is
   * re-encoding, not retrieval, and the item stays owed.
   */
  const resolveRevealed = useCallback(() => {
    if (done) return;
    setDone(true);
    play('soft-tap');
    trigger('tap');
    onAnswer?.(false, REVEAL_ATTEMPTS);
  }, [done, play, trigger, onAnswer]);

  /**
   * "I don't remember" — an honest blank, not a wrong guess. Scores as a failed
   * retrieval (it is one) but skips the error sound and the shake: punishing
   * the honest answer just teaches learners to type noise instead.
   */
  const handleDontKnow = useCallback(() => {
    if (done || revealed) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    fireTelemetry({
      event: 'cloze_wrong',
      payload: { wordId, attempts: nextAttempts, reason: 'dont_know' },
    });
    reveal();
  }, [done, revealed, attempts, wordId, reveal]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (done || !phrase) return;
      // Enter in the revealed state means "continue", same as the button.
      if (revealed) {
        resolveRevealed();
        return;
      }
      const guess = typed.trim();
      if (!guess) return;
      const result = fuzzyMatchAnswer(guess, correctTarget);
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (result.kind === 'exact' || result.kind === 'close') {
        finalize();
        return;
      }

      play('incorrect');
      trigger('error');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      fireTelemetry({
        event: 'cloze_wrong',
        payload: { wordId, attempts: nextAttempts, distance: result.distance },
      });

      if (nextAttempts < REVEAL_ATTEMPTS) {
        setHint(meaningEn ?? null);
        setTyped('');
        inputRef.current?.focus();
        return;
      }
      // The miss is reported by resolveRevealed, once the learner has actually
      // had the answer in front of them.
      reveal();
    },
    [
      typed,
      correctTarget,
      attempts,
      done,
      revealed,
      phrase,
      meaningEn,
      play,
      trigger,
      finalize,
      reveal,
      resolveRevealed,
      wordId,
    ],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTyped(e.target.value);
      // Typing the revealed answer auto-continues — the encoding rep is the
      // point, so it shouldn't also cost a button press.
      if (revealed) {
        const r = fuzzyMatchAnswer(e.target.value, correctTarget, 0);
        if (r.kind === 'exact') resolveRevealed();
      }
    },
    [revealed, correctTarget, resolveRevealed],
  );

  // Defensive: caller should have filtered cloze when no phrases exist;
  // if it slipped through, signal completion in an effect (run unconditionally).
  useEffect(() => {
    if (!phrase) onCorrect();
  }, [phrase, onCorrect]);

  if (!phrase) return null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center py-6 relative px-4">
        <p className="text-center text-[color:var(--text-secondary)] text-[13px] font-semibold mb-4">
          Fill in the blank
        </p>
        <p
          className="text-center text-[color:var(--text-secondary)] mb-4 max-w-md"
          style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)' }}
        >
          {phrase.text_en}
        </p>
        <p
          className="text-center font-display text-[color:var(--color-fox-primary)] leading-tight mb-2"
          style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)' }}
        >
          <span>{cloze.before}</span>
          <span className="border-b-2 border-dashed border-[color:var(--color-fox-primary)] inline-block min-w-[3ch] mx-1 align-baseline opacity-70">
            {revealed ? correctTarget : BLANK}
          </span>
          <span>{cloze.after}</span>
        </p>

        {hint && !revealed ? (
          <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
            Hint: the word means <span className="font-semibold text-[color:var(--color-fox-primary)]">{hint}</span>
          </p>
        ) : null}
        {revealed ? (
          <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
            The word is <span className="font-bold text-[color:var(--color-fox-primary)]">{correctTarget}</span> · type it to lock it in
          </p>
        ) : null}

        {passed ? (
          <div className="mt-5 animate-spring-in">
            <Fox pose="celebrating" size="sm" aria-label="Correct" />
          </div>
        ) : null}
        <Celebration active={celebrate} variant="correct" />

        {passed ? (
          <span
            aria-hidden
            className="absolute top-10 right-6 animate-xp-tick text-base font-bold text-[var(--color-fox-primary)]"
          >
            +{XP_AMOUNTS.cloze_correct} XP
          </span>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`pb-2 flex flex-col gap-2 transition-[padding] duration-150 ${shake ? 'animate-shake' : ''}`}
        style={keyboardHeight > 0 ? { paddingBottom: keyboardHeight } : undefined}
      >
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={handleChange}
          disabled={done}
          inputMode="text"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={revealed ? 'Type the word above…' : 'Type the missing word…'}
          aria-label="Type the missing word"
          className={`w-full rounded-xl border px-4 py-3 text-base bg-surface-inset border-card-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-default disabled:opacity-60 ${revealed && !done ? 'border-amber-500/60' : ''}`}
        />
        {revealed ? (
          // Always enabled: the reveal must never be a place you can get stuck.
          <button
            type="button"
            onClick={resolveRevealed}
            disabled={done}
            className="rounded-xl bg-[color:var(--color-fox-primary)] text-white font-bold py-3 disabled:opacity-40 active:scale-[0.98] transition"
          >
            Continue
          </button>
        ) : (
          <>
            <button
              type="submit"
              disabled={done || typed.trim().length === 0}
              className="rounded-xl bg-[color:var(--color-fox-primary)] text-white font-bold py-3 disabled:opacity-40 active:scale-[0.98] transition"
            >
              Check
            </button>
            <button
              type="button"
              onClick={handleDontKnow}
              disabled={done}
              className="rounded-xl border border-card-border text-[color:var(--text-secondary)] font-semibold py-2.5 text-sm disabled:opacity-40 active:scale-[0.98] transition"
            >
              I don&apos;t remember
            </button>
          </>
        )}
      </form>
    </div>
  );
}
