'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PronunciationResult, SupportedLanguageCode } from '@/types/audio';
import { startSpeechAttempt, playPhraseAudio } from '@/lib/audio';
import { MicIcon, ScoreDisplay } from '@/components/audio/mic-ui';

/**
 * "Say it out loud" — the speaking cue, in the drill and in conversation.
 *
 * What this actually measures, stated plainly because the UI must not overclaim:
 * the browser transcribes what it heard and we compare that string to the
 * target. A strong accent the browser still transcribes scores perfectly; good
 * pronunciation the browser mishears scores badly. So the copy says "we heard",
 * never "your pronunciation is". Chrome sends the audio to Google — same
 * disclosure the standalone speaking page carries.
 *
 * The hard rule: a microphone problem is NEVER a wrong answer. Denied
 * permission, silence and recognition errors all resolve as `not_scored`,
 * which offers a retry and a way out to typing, and after two in a row bails
 * to typing on its own. The learner cannot be stranded on a mic they don't
 * have.
 */

export type SpeakOutcome =
  | { kind: 'pass'; result: PronunciationResult }
  | { kind: 'fail'; result: PronunciationResult }
  | { kind: 'fallback'; reason: 'not_scored' | 'user' };

type Stage = 'idle' | 'listening' | 'result';

/** Two consecutive silent/blocked attempts and we stop asking. */
const MAX_NOT_SCORED = 2;

interface SpeakChallengeProps {
  /** The line the learner should say. */
  target: string;
  /** English prompt shown above it. */
  promptEn: string;
  languageCode: SupportedLanguageCode;
  /** Pre-generated audio for the model utterance; falls back to browser TTS. */
  audioUrl?: string | null;
  romanization?: string | null;
  /**
   * Show the target text. True in the drill, where this is repeat-after-me and
   * seeing the line is the point. False in conversation, where the speak tier
   * sits above typing on the ladder and showing the line would hand over the
   * answer they are supposed to be recalling.
   */
  showTarget?: boolean;
  /** Play the model utterance on mount. Same reasoning as `showTarget`. */
  modelFirst?: boolean;
  /** Footer-sized layout for the conversation block, which owns its own prompt. */
  compact?: boolean;
  onOutcome: (outcome: SpeakOutcome) => void;
  /** Observational: fires on every unscored attempt, for telemetry and for the
   * parent's decision to stop offering speak this scene. */
  onNotScored?: (result: PronunciationResult) => void;
}

export function SpeakChallenge({
  target,
  promptEn,
  languageCode,
  audioUrl,
  romanization,
  showTarget = true,
  modelFirst = true,
  compact = false,
  onOutcome,
  onNotScored,
}: SpeakChallengeProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [retryUsed, setRetryUsed] = useState(false);
  const notScoredCount = useRef(0);
  const stopRef = useRef<() => void>(() => {});
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stopRef.current();
    };
  }, []);

  const playModel = useCallback(() => {
    void playPhraseAudio(audioUrl, { text: target, languageCode }).catch(() => {});
  }, [audioUrl, target, languageCode]);

  // Hear it before saying it — the listen → repeat loop the hands-free engine
  // already uses. Skipped where the point is recall rather than imitation.
  useEffect(() => {
    if (modelFirst) playModel();
  }, [modelFirst, playModel]);

  const listen = useCallback(() => {
    if (stage === 'listening') return;
    setStage('listening');
    setResult(null);

    const attempt = startSpeechAttempt(target, languageCode, { romanization });
    stopRef.current = attempt.stop;

    void attempt.promise.then((r) => {
      if (!aliveRef.current) return;
      setResult(r);
      setStage('result');

      if (r.score === 'not_scored') {
        notScoredCount.current += 1;
        onNotScored?.(r);
        if (notScoredCount.current >= MAX_NOT_SCORED) {
          onOutcome({ kind: 'fallback', reason: 'not_scored' });
        }
        return;
      }

      // We heard something, so this is a real verdict. `getting_there` counts
      // as a pass: the thresholds were tuned on single words and are being
      // applied to sentences, so the generous side is the safe side until
      // there is real speak_correct / speak_wrong volume to retune against.
      notScoredCount.current = 0;
      if (r.score === 'close_enough' || r.score === 'getting_there') {
        onOutcome({ kind: 'pass', result: r });
      }
      // 'try_again' waits for the learner — one retry, then Continue.
    });
  }, [stage, target, languageCode, romanization, onOutcome, onNotScored]);

  const retry = useCallback(() => {
    if (result?.score === 'try_again') setRetryUsed(true);
    setStage('idle');
    setResult(null);
  }, [result]);

  const heardLine =
    result && result.transcription.trim().length > 0
      ? `We heard: “${result.transcription.trim()}”`
      : null;

  const info = (
    <>
      {heardLine ? (
        <p className="mt-3 text-sm text-[color:var(--text-secondary)]">{heardLine}</p>
      ) : null}
      {stage === 'result' && result ? (
        <div className="mt-2 flex justify-center">
          <ScoreDisplay result={result} />
        </div>
      ) : null}
      {stage === 'listening' ? (
        <p className="mt-3 text-sm font-medium text-red-400">Listening…</p>
      ) : null}
    </>
  );

  const controls = (
    <div className={`flex flex-col items-center gap-3 ${compact ? '' : 'pb-2'}`}>
        {stage !== 'result' ? (
          <>
            <button
              type="button"
              onClick={listen}
              disabled={stage === 'listening'}
              aria-label="Tap and say it"
              className={`relative inline-flex items-center justify-center rounded-full w-20 h-20 transition-colors ${
                stage === 'listening'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-[color:var(--color-fox-primary)] text-white active:scale-95'
              }`}
            >
              {stage === 'listening' && (
                <span className="absolute inset-0 rounded-full bg-red-400/30 animate-pulse" />
              )}
              <MicIcon size={32} />
            </button>
            <button
              type="button"
              onClick={() => onOutcome({ kind: 'fallback', reason: 'user' })}
              className="text-sm text-[color:var(--text-secondary)] underline underline-offset-4"
            >
              Type it instead
            </button>
          </>
        ) : result?.score === 'not_scored' ? (
          <div className="w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={retry}
              className="w-full rounded-xl bg-[color:var(--color-fox-primary)] text-white font-bold py-3 active:scale-[0.98] transition"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => onOutcome({ kind: 'fallback', reason: 'user' })}
              className="w-full rounded-xl border border-card-border text-[color:var(--foreground)] font-semibold py-3"
            >
              Type it instead
            </button>
          </div>
        ) : result?.score === 'try_again' ? (
          <div className="w-full flex flex-col gap-2">
            {!retryUsed ? (
              <button
                type="button"
                onClick={retry}
                className="w-full rounded-xl bg-[color:var(--color-fox-primary)] text-white font-bold py-3 active:scale-[0.98] transition"
              >
                Try again
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onOutcome({ kind: 'fail', result })}
              className="w-full rounded-xl border border-card-border text-[color:var(--foreground)] font-semibold py-3"
            >
              Continue
            </button>
          </div>
        ) : null}

        <p className="text-[11px] text-[color:var(--text-secondary)] px-4 text-center">
          Your browser does the listening — in Chrome that means the audio goes to Google.
        </p>
    </div>
  );

  if (compact) {
    return (
      <div className="flex flex-col">
        <div className="text-center">{info}</div>
        <div className="mt-2">{controls}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 text-center">
        <p className="text-[color:var(--text-secondary)] text-[13px] font-semibold mb-3">
          Say it out loud
        </p>
        <p
          className="font-display text-[color:var(--color-fox-primary)] leading-tight"
          style={{ fontSize: 'clamp(1.5rem, 5vw, 2.125rem)' }}
        >
          {promptEn}
        </p>

        {showTarget ? (
          <button
            type="button"
            onClick={playModel}
            className="mt-3 text-base text-[color:var(--foreground)] underline decoration-dotted underline-offset-4"
          >
            {target}
          </button>
        ) : null}

        {info}
      </div>
      {controls}
    </div>
  );
}
