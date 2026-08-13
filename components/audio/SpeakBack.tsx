'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PronunciationResult, SupportedLanguageCode } from '@/types/audio';
import { startSpeechAttempt } from '@/lib/audio';
import { MicIcon, ScoreDisplay, Waveform } from '@/components/audio/mic-ui';

/**
 * "Say it back" — the smallest complete speaking control, for surfaces that
 * already have their own layout and just want a mic.
 *
 * Pronouncing things and being heard was supposed to be the point, and it
 * existed on exactly two screens: the standalone speaking session and the
 * drill's SpeakChallenge. Everywhere else — reviews, the tutor, info bytes —
 * you could hear the language but never answer it. This is deliberately a
 * strip rather than a screen so it can sit under a review card or a chat
 * bubble without owning the page.
 *
 * The rule from SpeakChallenge carries over unchanged and is the reason this
 * is a shared component rather than four copies: **a microphone problem is
 * never a wrong answer.** Denied permission, silence and dead speech services
 * all come back `not_scored`, which is reported as "we didn't hear that", never
 * as a failure, and never scores against the learner.
 */

type Stage = 'idle' | 'listening' | 'result';

/** No amount of retrying fixes a browser with no speech service behind it. */
const TERMINAL_REASONS = new Set(['service_blocked', 'unsupported_browser']);

/**
 * Callers must pass `key={target}`.
 *
 * A new line to say is a new question, and a remount is the honest reset: it
 * clears the previous verdict (which would otherwise read as a score for
 * something the learner was never asked to say) and closes any open mic through
 * the unmount cleanup, with no reset branch to keep correct.
 */
interface SpeakBackProps {
  /** The line to say. */
  target: string;
  languageCode: SupportedLanguageCode;
  romanization?: string | null;
  /** Prompt above the mic. Defaults to the generic cue. */
  label?: string;
  /** Fires on every settled attempt, scored or not. Purely observational — the
   *  host surface decides whether speaking counts for anything. */
  onResult?: (result: PronunciationResult) => void;
  className?: string;
}

export function SpeakBack({
  target,
  languageCode,
  romanization,
  label = 'Say it back',
  onResult,
  className = '',
}: SpeakBackProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const micLevelRef = useRef(0);
  const stopRef = useRef<() => void>(() => {});
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      // Leaving mid-listen has to close the mic, not just stop caring about it.
      stopRef.current();
    };
  }, []);

  const listen = useCallback(() => {
    if (stage === 'listening') return;
    setStage('listening');
    setResult(null);

    const attempt = startSpeechAttempt(target, languageCode, {
      romanization,
      onLevel: (level) => {
        micLevelRef.current = level;
      },
    });
    stopRef.current = attempt.stop;

    void attempt.promise.then((r) => {
      if (!aliveRef.current) return;
      setResult(r);
      setStage('result');
      onResult?.(r);
    });
  }, [stage, target, languageCode, romanization, onResult]);

  const listening = stage === 'listening';
  const terminal = !!result && TERMINAL_REASONS.has(result.reason ?? '');

  // Prose, not the score pill: the pill is shaped for verdicts on the learner,
  // and this is a statement about their browser.
  if (terminal && result) {
    return (
      <p className={`text-xs text-[color:var(--text-secondary)] ${className}`}>
        {result.feedback}
      </p>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={listen}
        disabled={listening}
        aria-label={listening ? 'Listening' : label}
        className={`relative shrink-0 grid place-items-center w-11 h-11 rounded-full transition-colors ${
          listening
            ? 'bg-red-500 text-white'
            : 'bg-[var(--surface-inset)] text-[color:var(--foreground)] active:scale-95'
        }`}
      >
        {listening && (
          <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
        )}
        <span className="relative">
          <MicIcon size={20} />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        {listening ? (
          <>
            <p className="text-xs font-bold text-red-400">Speak now — recording</p>
            <Waveform
              levelRef={micLevelRef}
              active
              className="mt-1 block w-full h-5 text-red-400"
            />
          </>
        ) : result ? (
          <div className="flex items-center gap-2 flex-wrap">
            <ScoreDisplay result={result} />
            <button
              type="button"
              onClick={listen}
              className="text-xs underline underline-offset-4 text-[color:var(--text-secondary)]"
            >
              Again
            </button>
          </div>
        ) : (
          <p className="text-xs text-[color:var(--text-secondary)]">{label}</p>
        )}
      </div>
    </div>
  );
}
