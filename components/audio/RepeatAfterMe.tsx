'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SupportedLanguageCode, PronunciationResult } from '@/types/audio';
import { isScoringAvailable, startPronunciationChallenge } from '@/lib/audio';

type ComponentState = 'idle' | 'listening' | 'processing' | 'showing_result';

interface RepeatAfterMeProps {
  wordId: string;
  languageCode: SupportedLanguageCode;
  onResult?: (result: PronunciationResult) => void;
  className?: string;
}

export function RepeatAfterMe({ wordId, languageCode, onResult, className = '' }: RepeatAfterMeProps) {
  const [state, setState] = useState<ComponentState>('idle');
  const [available, setAvailable] = useState(true);
  const [result, setResult] = useState<PronunciationResult | null>(null);

  useEffect(() => {
    setAvailable(isScoringAvailable(languageCode));
  }, [languageCode]);

  useEffect(() => {
    if (state !== 'showing_result') return;
    const timer = setTimeout(() => {
      setState('idle');
      setResult(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [state]);

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return;

    setState('listening');
    try {
      const challenge = await startPronunciationChallenge(wordId);
      setState('processing');

      if (challenge.result) {
        setResult(challenge.result);
        onResult?.(challenge.result);
        setState('showing_result');
      } else {
        setState('idle');
      }
    } catch {
      setState('idle');
    }
  }, [wordId, state, onResult]);

  if (!available) {
    return (
      <div className={`flex items-center gap-2 text-sm text-text-secondary ${className}`}>
        <MicIcon size={20} />
        <span>Pronunciation practice not available</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={state !== 'idle'}
        className={`relative inline-flex items-center justify-center rounded-full p-3 transition-colors ${
          state === 'listening'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-white/10 text-text-secondary hover:bg-white/15 active:bg-white/20'
        } disabled:opacity-70`}
        aria-label={state === 'listening' ? 'Listening...' : 'Start pronunciation practice'}
      >
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-full bg-red-400/30 animate-pulse" />
        )}
        <MicIcon size={24} />
      </button>

      {state === 'listening' && (
        <span className="text-sm text-red-400 font-medium">Listening...</span>
      )}

      {state === 'processing' && (
        <span className="text-sm text-text-secondary">Processing...</span>
      )}

      {state === 'showing_result' && result && (
        <ScoreDisplay result={result} />
      )}
    </div>
  );
}

function ScoreDisplay({ result }: { result: PronunciationResult }) {
  const config = {
    close_enough: { icon: '✓', color: 'text-green-400', bg: 'bg-green-500/20' },
    getting_there: { icon: '◐', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    try_again: { icon: '↻', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  }[result.score];

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${config.bg}`}>
      <span className={`text-lg font-bold ${config.color}`}>{config.icon}</span>
      <span className={`text-sm ${config.color}`}>{result.feedback}</span>
    </div>
  );
}

function MicIcon({ size }: { size: number }) {
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
