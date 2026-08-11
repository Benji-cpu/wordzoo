'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { Celebration } from '@/components/ui/Celebration';
import { Fox } from '@/components/mascot/Fox';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { useXP, XP_AMOUNTS } from '@/lib/hooks/useXP';
import { fuzzyMatchAnswer, allowedEditsFor } from '@/lib/pedagogy/normalize';
import { fireTelemetry } from '@/lib/pedagogy/telemetry';
import type { SupportedLanguageCode } from '@/types/audio';

/**
 * Attempts reported when the learner needed the answer shown — either they
 * burned both tries or they pressed "I don't remember". Every call site keys
 * on `attempts >= REVEAL_ATTEMPTS` to mark the item wrong, so a straight-away
 * "I don't remember" resolves at 2 even though it only cost one press.
 */
const REVEAL_ATTEMPTS = 2;

interface ProductionTypingProps {
  /** English meaning shown as the prompt the learner translates from. */
  promptEn: string;
  /** Foreign-language target the learner must type. */
  correctTarget: string;
  targetLanguageCode?: SupportedLanguageCode;
  wordId: string;
  /** Optional pre-generated pronunciation; played on correct answer. */
  audioUrl?: string | null;
  /** Fuzzy-match tolerance (Levenshtein edit distance). Defaults to
   * `allowedEditsFor(correctTarget)` — scaled to target length, so a 4-letter
   * word must be spelled exactly. Only override to be stricter. */
  maxEdits?: number;
  onCorrect: () => void;
  /**
   * Fired when the item resolves, and on the first wrong attempt. `attempts`
   * counts how many tries this word took (1-indexed: 1 = first try).
   * `accuracy` is 'exact' for distance-0 and 'close' for distance 1-2.
   *
   * A learner who needed the answer shown resolves as
   * `onAnswer(false, REVEAL_ATTEMPTS)` and never fires `onCorrect` — the call
   * site's wrong-handling is what advances the drill. See `resolveRevealed`.
   */
  onAnswer?: (correct: boolean, attempts: number, accuracy?: 'exact' | 'close') => void;
}

export function ProductionTyping({
  promptEn,
  correctTarget,
  targetLanguageCode,
  wordId,
  audioUrl,
  maxEdits,
  onCorrect,
  onAnswer,
}: ProductionTypingProps) {
  const ALLOWED_EDITS = maxEdits ?? allowedEditsFor(correctTarget);
  const [typed, setTyped] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [closeMatch, setCloseMatch] = useState(false);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);
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
      setPassed(true);
      setCelebrate(true);
      play('correct');
      trigger('success');
      void award('production_correct');
      // A near-miss is scored as its own cue, not as a correct production.
      // getCueAccuracy keys off the _correct/_wrong suffix, so filtering on
      // payload.accuracy wouldn't work — an inexact spelling was landing in the
      // same bucket as a perfect one, which is part of why production read
      // 29 correct / 0 wrong. 'production_close_correct' still matches
      // %_correct and CUE_FROM_EVENT strips the suffix, so it renders as its
      // own row on /admin/pedagogy with no query change.
      //
      // The XP and the success sound are unchanged on purpose: this is a
      // measurement fix, not a grading one. Docking a learner for a one-letter
      // typo on an eight-letter word would be punitive and would generate
      // feedback.
      fireTelemetry({
        event: accuracy === 'close' ? 'production_close_correct' : 'production_correct',
        payload: { wordId, attempts: attempts + 1, accuracy },
      });
      onAnswer?.(true, attempts + 1, accuracy);
      setTimeout(onCorrect, 1100);
    },
    [done, play, trigger, award, wordId, attempts, onAnswer, onCorrect],
  );

  /** Show the answer and switch to type-it-to-continue. Notifies nobody. */
  const reveal = useCallback(() => {
    setRevealed(true);
    setHint(correctTarget);
    setTyped('');
    play('reveal');
    inputRef.current?.focus();
  }, [correctTarget, play]);

  /**
   * The learner has seen the answer and is moving on. Report the miss NOW —
   * not when the answer was revealed.
   *
   * Every call site reacts to `onAnswer(false, 2)` by mutating its drill queue,
   * which re-keys this component and remounts it with a fresh attempt counter.
   * Reporting at reveal time therefore tore the reveal off the screen in the
   * same tick it appeared: the answer was never actually readable, the item
   * came back later at attempt 0, and a learner who didn't know the word could
   * loop on it forever with no way to find out what it was. Reported here, the
   * reveal survives until it's dismissed.
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
   * "I don't remember" — an honest blank, not a wrong guess. It scores as a
   * failed retrieval (it is one) but skips the error sound and the shake:
   * punishing the honest answer just teaches learners to type noise instead,
   * which is exactly what it exists to replace.
   */
  const handleDontKnow = useCallback(() => {
    if (done || revealed) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    fireTelemetry({
      event: 'production_wrong',
      payload: { wordId, attempts: nextAttempts, reason: 'dont_know' },
    });
    reveal();
  }, [done, revealed, attempts, wordId, reveal]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (done) return;
      // Enter in the revealed state means "continue", same as the button.
      if (revealed) {
        resolveRevealed();
        return;
      }
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
      fireTelemetry({
        event: 'production_wrong',
        payload: { wordId, attempts: nextAttempts, distance: result.distance },
      });

      if (nextAttempts < REVEAL_ATTEMPTS) {
        // First wrong: surface the first letter as a hint, clear input. Safe to
        // report — call sites ignore anything below REVEAL_ATTEMPTS, so the
        // hint stays on screen.
        onAnswer?.(false, nextAttempts);
        setHint(correctTarget.charAt(0));
        setTyped('');
        inputRef.current?.focus();
        return;
      }

      // Second wrong: show the answer. The miss is reported by
      // resolveRevealed, once the learner has actually had it in front of them.
      reveal();
    },
    [
      typed,
      correctTarget,
      ALLOWED_EDITS,
      attempts,
      done,
      revealed,
      play,
      trigger,
      finalize,
      reveal,
      resolveRevealed,
      onAnswer,
      wordId,
    ],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTyped(e.target.value);
      // Typing the revealed answer auto-continues — the encoding rep is the
      // point, so it shouldn't also cost a button press.
      if (revealed) {
        const result = fuzzyMatchAnswer(e.target.value, correctTarget, 0);
        if (result.kind === 'exact') {
          resolveRevealed();
        }
      }
    },
    [revealed, correctTarget, resolveRevealed],
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
            Answer: <span className="font-bold text-[color:var(--color-fox-primary)]">{correctTarget}</span> · type it to lock it in
          </p>
        ) : null}
        {closeMatch && done ? (
          <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
            Close — exact spelling: <span className="font-bold text-[color:var(--color-fox-primary)]">{correctTarget}</span>
          </p>
        ) : null}

        {revealed && !passed ? (
          // Hearing the word you couldn't retrieve is the whole value of the
          // reveal. `text`/`languageCode` are passed so this still speaks for
          // phrase drills, where `wordId` is a phrase id with no audio row.
          <div className="mt-4">
            <PronunciationButton
              wordId={wordId}
              audioUrl={audioUrl}
              text={correctTarget}
              languageCode={targetLanguageCode}
              size={22}
            />
          </div>
        ) : null}

        {passed ? (
          <div className="mt-5 flex items-center gap-2 animate-spring-in">
            <Fox pose="celebrating" size="sm" aria-label="Correct" />
            <PronunciationButton wordId={wordId} size={22} />
          </div>
        ) : null}

        <Celebration active={celebrate} variant="correct" />

        {passed ? (
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
        className={`pb-2 flex flex-col gap-2 ${shake ? 'animate-shake' : ''}`}
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
          placeholder={revealed ? 'Type the answer above…' : 'Type your answer…'}
          aria-label="Type the foreign-language word"
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
              disabled={buttonDisabled}
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
