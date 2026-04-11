'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { stopPlayback } from '@/lib/audio';

export interface ListeningExerciseProps {
  audioUrl: string;
  correctAnswer: string;       // The Indonesian text
  correctTranslation: string;  // English translation
  distractors: string[];        // Wrong English translations (for recognition mode)
  mode: 'recognition' | 'dictation';
  onComplete: (correct: boolean) => void;
}

/* ---- Levenshtein distance ---- */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,     // deletion
        dp[i][j - 1] + 1,     // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

function playAudioAtRate(url: string, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.playbackRate = rate;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Audio playback failed'));
    audio.play().catch(reject);
  });
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function ListeningExercise({
  audioUrl,
  correctAnswer,
  correctTranslation,
  distractors,
  mode,
  onComplete,
}: ListeningExerciseProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [options] = useState<string[]>(() => shuffleArray([correctTranslation, ...distractors.slice(0, 3)]));
  const autoPlayedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-play on mount
  useEffect(() => {
    if (autoPlayedRef.current) return;
    autoPlayedRef.current = true;

    const timer = setTimeout(() => {
      setIsPlaying(true);
      playAudioAtRate(audioUrl, 1.0)
        .catch(() => {})
        .finally(() => setIsPlaying(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPlayback();
  }, []);

  const handlePlay = useCallback(async (rate = 1.0) => {
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    try {
      await playAudioAtRate(audioUrl, rate);
    } catch {
      // ignore
    } finally {
      setIsPlaying(false);
    }
  }, [audioUrl, isPlaying]);

  // --- Recognition mode: pick correct English translation ---
  const handleOptionSelect = useCallback((option: string) => {
    if (result) return; // Already answered
    setSelectedAnswer(option);
    const isCorrect = option === correctTranslation;
    setResult(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => onComplete(isCorrect), 1200);
  }, [result, correctTranslation, onComplete]);

  // --- Dictation mode: type what they heard ---
  const handleDictationSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (result) return;

    const normalized = typedAnswer.trim().toLowerCase();
    const target = correctAnswer.trim().toLowerCase();
    const distance = levenshtein(normalized, target);
    const isCorrect = distance <= 2;

    setResult(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => onComplete(isCorrect), 1800);
  }, [result, typedAnswer, correctAnswer, onComplete]);

  return (
    <Card className="py-6 animate-slide-up">
      <p className="text-xs text-text-secondary uppercase tracking-wider text-center mb-5">
        {mode === 'recognition' ? 'What did you hear?' : 'Type what you hear'}
      </p>

      {/* Large play button */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => handlePlay(1.0)}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-accent-id/25 border-2 border-accent-id shadow-lg shadow-accent-id/20'
              : 'bg-card-surface border-2 border-card-border hover:border-accent-id/50 hover:bg-accent-id/10'
          }`}
          aria-label={isPlaying ? 'Playing audio' : 'Play audio'}
        >
          {isPlaying ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-accent-id">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="animate-pulse" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-accent-id ml-1">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Replay controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePlay(1.0)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-text-secondary bg-card-surface border border-card-border hover:border-accent-id/30 transition-colors"
            aria-label="Replay"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Replay
          </button>
          <button
            type="button"
            onClick={() => handlePlay(0.7)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium text-text-secondary bg-card-surface border border-card-border hover:border-accent-id/30 transition-colors"
            aria-label="Play slowly"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 8 14" />
            </svg>
            Slow
          </button>
        </div>
      </div>

      {/* Recognition mode: multiple choice */}
      {mode === 'recognition' && (
        <div className="space-y-2 px-2">
          {options.map((option) => {
            let borderColor = 'border-card-border';
            let bgColor = '';
            if (result && option === correctTranslation) {
              borderColor = 'border-green-500';
              bgColor = 'bg-green-500/10';
            } else if (result === 'wrong' && option === selectedAnswer) {
              borderColor = 'border-red-500';
              bgColor = 'bg-red-500/10';
            } else if (!result) {
              borderColor = 'border-card-border hover:border-accent-id/40';
            }

            return (
              <button
                key={option}
                type="button"
                onClick={() => handleOptionSelect(option)}
                disabled={!!result}
                className={`w-full text-left px-4 py-3 rounded-xl border ${borderColor} ${bgColor} transition-colors text-foreground text-sm font-medium disabled:cursor-default`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}

      {/* Dictation mode: text input */}
      {mode === 'dictation' && (
        <form onSubmit={handleDictationSubmit} className="px-2 space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            disabled={!!result}
            placeholder="Type what you heard in Indonesian..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={`w-full px-4 py-3 rounded-xl border bg-card-surface text-foreground text-base font-medium placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-id/50 transition-colors disabled:opacity-60 ${
              result === 'correct'
                ? 'border-green-500 bg-green-500/10'
                : result === 'wrong'
                ? 'border-red-500 bg-red-500/10'
                : 'border-card-border'
            }`}
          />

          {!result && (
            <button
              type="submit"
              disabled={!typedAnswer.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-colors bg-accent-id text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-id/90"
            >
              Check
            </button>
          )}
        </form>
      )}

      {/* Feedback */}
      {result && (
        <div className={`mt-4 px-4 py-3 mx-2 rounded-xl ${
          result === 'correct' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <p className={`text-sm font-semibold mb-1 ${result === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
            {result === 'correct' ? 'Correct!' : 'Not quite'}
          </p>
          {result === 'wrong' && (
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                Answer: <span className="font-semibold text-accent-id">{correctAnswer}</span>
              </p>
              <p className="text-xs text-text-secondary">
                {correctTranslation}
              </p>
            </div>
          )}
          {result === 'correct' && mode === 'dictation' && (
            <p className="text-xs text-text-secondary">{correctTranslation}</p>
          )}
        </div>
      )}
    </Card>
  );
}
