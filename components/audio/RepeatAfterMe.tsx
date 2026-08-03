'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SupportedLanguageCode, PronunciationResult } from '@/types/audio';
import { isScoringAvailable, startPronunciationChallenge } from '@/lib/audio';
import { MicIcon, ScoreDisplay } from '@/components/audio/mic-ui';

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
            : 'bg-surface-inset text-text-secondary hover:bg-surface-inset active:bg-surface-inset'
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

