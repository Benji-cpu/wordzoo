'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';

interface TypedTranslationProps {
  promptEn: string;
  correctAnswer: string;
  onComplete: (correct: boolean) => void;
}

/**
 * Compute the Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export function TypedTranslation({
  promptEn,
  correctAnswer,
  onComplete,
}: TypedTranslationProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input on mount
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    if (result || !input.trim()) return;

    const normalized = input.trim().toLowerCase();
    const expected = correctAnswer.trim().toLowerCase();
    const distance = levenshteinDistance(normalized, expected);

    if (distance <= 2) {
      // Accept: exact or close enough (minor typos)
      setResult('correct');
      setTimeout(() => onComplete(true), 1500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        // Too many wrong attempts — show answer and move on
        setResult('wrong');
        setTimeout(() => onComplete(false), 3000);
      } else {
        // Provide hints
        setInput('');
        if (newAttempts >= 2) {
          const words = correctAnswer.split(/\s+/);
          setShowHint(
            `Hint: ${words.length} word${words.length > 1 ? 's' : ''}, starts with "${correctAnswer[0].toUpperCase()}"`
          );
        } else {
          setShowHint(
            `Hint: starts with "${correctAnswer[0].toUpperCase()}"`
          );
        }
      }
    }
  }, [input, result, correctAnswer, attempts, onComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="animate-slide-up">
      {/* Instruction */}
      <p className="text-center text-sm text-text-secondary mb-2">
        Translate to Indonesian:
      </p>
      <p className="text-center text-lg font-medium text-foreground mb-6">
        &ldquo;{promptEn}&rdquo;
      </p>

      {/* Input area */}
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={result !== null}
          placeholder="Type your answer..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={`w-full px-4 py-3 rounded-xl text-center text-lg font-medium border-2 bg-card-surface transition-colors outline-none ${
            result === 'correct'
              ? 'border-green-500 text-green-400'
              : result === 'wrong'
              ? 'border-red-500 text-red-400'
              : 'border-card-border text-foreground focus:border-accent-id'
          }`}
        />

        {/* Hint display */}
        {showHint && !result && (
          <p className="text-center text-sm text-amber-400/80 animate-fade-in-up">
            {showHint}
          </p>
        )}

        {/* Attempt counter */}
        {attempts > 0 && !result && (
          <p className="text-center text-xs text-text-secondary">
            Attempt {attempts + 1} of 3
          </p>
        )}

        {/* Submit button */}
        {!result && (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-full px-6 py-3 rounded-xl text-sm font-semibold bg-accent-id text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-id/90 active:scale-95 transition-all"
          >
            Check
          </button>
        )}
      </div>

      {/* Result feedback */}
      {result === 'correct' && (
        <Card className="mt-4 text-center animate-fade-in-up">
          <p className="text-green-400 font-semibold text-lg">Correct!</p>
          <p className="text-accent-id font-medium mt-1">{correctAnswer}</p>
        </Card>
      )}

      {result === 'wrong' && (
        <Card className="mt-4 text-center animate-fade-in-up">
          <p className="text-red-400 font-semibold mb-2">Not quite</p>
          <p className="text-sm text-text-secondary mb-1">Your answer:</p>
          <p className="text-red-400/70 line-through mb-2">{input}</p>
          <p className="text-sm text-text-secondary mb-1">Correct answer:</p>
          <p className="text-green-400 font-medium text-lg">{correctAnswer}</p>
        </Card>
      )}
    </div>
  );
}
