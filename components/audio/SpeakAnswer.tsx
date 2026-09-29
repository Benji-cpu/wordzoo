'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { startRecognition } from '@/lib/audio/scoring';
import { recognitionLang } from '@/lib/audio/recognition-lang';
import { isSpeechServiceBlocked } from '@/lib/audio/speech-support';
import { usePace } from '@/lib/hooks/usePace';
import { HeardLine, LanguageChip, MicIcon } from '@/components/audio/mic-ui';

/**
 * The one mic control for answering in the target language.
 *
 * It listens once and hands back what it heard; it never grades. A microphone
 * problem is not a wrong answer, so every failure goes to `onUnavailable` with
 * a reason and the caller offers typing instead. Recognition starts
 * synchronously inside the tap, which mobile browsers require.
 */

export interface SpeakAnswerProps {
  languageCode: string;
  /** Speech alternatives, best-first. Fires once per successful listen. */
  onResult: (alternatives: string[]) => void;
  /** Any failure to get a transcript (mic denied, silence, no service). The
   *  caller decides whether that means "switch to typing". */
  onUnavailable?: (reason: string) => void;
  disabled?: boolean;
  label?: string;
  autoFocus?: boolean;
}

type Stage = 'idle' | 'starting' | 'listening' | 'heard' | 'error';

/** True when the browser has a speech recogniser and it has not just failed. */
export function isSpeechAnswerAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  if (!w.SpeechRecognition && !w.webkitSpeechRecognition) return false;
  return !isSpeechServiceBlocked();
}

const SHORT_MESSAGES: Record<string, string> = {
  mic_denied: 'The mic is blocked. Allow it in your browser settings, or type it.',
  no_speech: "Didn't catch anything. Tap and try again, or type it.",
  service_blocked: "Speech isn't available in this browser. Type it instead.",
  unsupported_browser: "Speech isn't available in this browser. Type it instead.",
  recognition_error: 'The mic hit a snag. Try again, or type it.',
};

export function SpeakAnswer({
  languageCode,
  onResult,
  onUnavailable,
  disabled = false,
  label = 'Tap and say it',
  autoFocus = false,
}: SpeakAnswerProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [sounding, setSounding] = useState(false);
  const [heard, setHeard] = useState('');
  const [message, setMessage] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const stopRef = useRef<() => void>(() => {});
  const aliveRef = useRef(true);
  const { reduced } = usePace();
  const { label: langLabel } = recognitionLang(languageCode);

  useEffect(() => {
    aliveRef.current = true;
    if (autoFocus) buttonRef.current?.focus();
    return () => {
      aliveRef.current = false;
      // Leaving mid-listen has to close the mic, not just stop caring about it.
      stopRef.current();
    };
  }, [autoFocus]);

  const listen = useCallback(() => {
    if (stage === 'starting' || stage === 'listening') return;
    setStage('starting');
    setSounding(false);
    setMessage('');

    // Called straight from the tap: no await before it.
    const attempt = startRecognition(languageCode, {
      onAudioStart: () => aliveRef.current && setStage('listening'),
      onSoundStart: () => aliveRef.current && setSounding(true),
    });
    stopRef.current = attempt.stop;

    void attempt.promise.then((outcome) => {
      if (!aliveRef.current) return;
      setSounding(false);
      if (outcome.ok) {
        setHeard(outcome.alternatives[0]);
        setStage('heard');
        onResult(outcome.alternatives);
      } else {
        setMessage(SHORT_MESSAGES[outcome.reason] ?? SHORT_MESSAGES.recognition_error);
        setStage('error');
        onUnavailable?.(outcome.reason);
      }
    });
  }, [stage, languageCode, onResult, onUnavailable]);

  const busy = stage === 'starting' || stage === 'listening';
  const listening = stage === 'listening';
  const status =
    stage === 'starting' ? 'Starting the mic…' : listening ? 'Listening…' : label;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={listen}
        disabled={disabled || stage === 'starting'}
        aria-label={busy ? 'Listening' : label}
        aria-pressed={busy}
        className={`relative grid place-items-center w-20 h-20 rounded-full transition-colors disabled:opacity-50 ${
          busy
            ? 'bg-red-500 text-white'
            : 'bg-accent-default text-white active:scale-95'
        }`}
      >
        {listening && sounding && !reduced && (
          <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
        )}
        {listening && !sounding && (
          <span className="absolute -inset-1 rounded-full border-2 border-red-500/40" />
        )}
        <span className="relative">
          <MicIcon size={32} />
        </span>
      </button>

      <p
        className={`text-sm font-semibold ${busy ? 'text-red-400' : 'text-[color:var(--foreground)]'}`}
        role="status"
        aria-live="polite"
      >
        {status}
      </p>

      <LanguageChip label={langLabel} prefix={listening ? 'Listening in' : 'Speak in'} />

      {stage === 'heard' && heard && <HeardLine text={heard} />}
      {stage === 'error' && (
        <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
