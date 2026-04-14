'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';

interface SentenceBuilderProps {
  prompt: string;
  correctAnswer: string;
  distractors: string[];
  explanation?: string;
  onComplete: (correct: boolean) => void;
}

export function SentenceBuilder({
  prompt,
  correctAnswer,
  distractors,
  explanation,
  onComplete,
}: SentenceBuilderProps) {
  const correctWords = useMemo(() => correctAnswer.split(/\s+/), [correctAnswer]);

  // Combine correct words with distractors, shuffled deterministically
  const allTiles = useMemo(() => {
    const tiles = [...correctWords, ...distractors.slice(0, 2)];
    const hash = prompt.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return tiles
      .map((word, i) => ({ word, id: i, sort: (hash * (i + 1) * 37) % 1000 }))
      .sort((a, b) => a.sort - b.sort);
  }, [correctWords, distractors, prompt]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [shaking, setShaking] = useState(false);

  const poolTiles = useMemo(
    () => allTiles.filter((t) => !selectedIds.includes(t.id)),
    [allTiles, selectedIds]
  );

  const selectedTiles = useMemo(
    () => selectedIds.map((id) => allTiles.find((t) => t.id === id)!),
    [selectedIds, allTiles]
  );

  const handlePoolTap = useCallback(
    (id: number) => {
      if (result) return;
      setSelectedIds((prev) => [...prev, id]);
    },
    [result]
  );

  const handleSelectedTap = useCallback(
    (id: number) => {
      if (result) return;
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    },
    [result]
  );

  const handleCheck = useCallback(() => {
    const userAnswer = selectedTiles.map((t) => t.word).join(' ');
    if (userAnswer === correctAnswer) {
      setResult('correct');
      setTimeout(() => onComplete(true), 2000);
    } else {
      setResult('wrong');
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      setTimeout(() => onComplete(false), 3000);
    }
  }, [selectedTiles, correctAnswer, onComplete]);

  const handleReset = useCallback(() => {
    if (result) return;
    setSelectedIds([]);
  }, [result]);

  const canCheck = selectedIds.length >= correctWords.length;

  return (
    <div className="animate-slide-up">
      {/* Instruction */}
      <p className="text-center text-sm text-text-secondary mb-2">
        Build the sentence:
      </p>
      <p className="text-center text-lg font-medium text-foreground mb-4">
        &ldquo;{prompt}&rdquo;
      </p>

      {/* Sentence building area */}
      <div
        className={`min-h-[56px] rounded-xl border-2 border-dashed p-3 mb-4 flex flex-wrap gap-2 items-center transition-colors ${
          result === 'correct'
            ? 'border-green-500 bg-green-500/10'
            : result === 'wrong'
            ? 'border-red-500 bg-red-500/10'
            : 'border-card-border bg-card-surface/50'
        } ${shaking ? 'animate-shake' : ''}`}
      >
        {selectedTiles.length === 0 ? (
          <p className="text-sm text-text-secondary/50 mx-auto">
            Tap words below to build the sentence
          </p>
        ) : (
          selectedTiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleSelectedTap(tile.id)}
              disabled={result !== null}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                result === 'correct'
                  ? 'bg-green-500/20 border border-green-500 text-green-400'
                  : result === 'wrong'
                  ? 'bg-red-500/20 border border-red-500 text-red-400'
                  : 'bg-accent-id/20 border border-accent-id/50 text-accent-id hover:bg-accent-id/30 active:scale-95'
              }`}
            >
              {tile.word}
            </button>
          ))
        )}
      </div>

      {/* Word pool */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {poolTiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => handlePoolTap(tile.id)}
            disabled={result !== null}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-card-surface border border-card-border text-foreground hover:bg-surface-inset active:scale-95 transition-all disabled:opacity-50"
          >
            {tile.word}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      {!result && (
        <div className="flex gap-3 justify-center">
          {selectedIds.length > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-sm text-text-secondary border border-card-border hover:bg-surface-inset transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={handleCheck}
            disabled={!canCheck}
            className="px-6 py-2 rounded-xl text-sm font-semibold bg-accent-id text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-id/90 active:scale-95 transition-all"
          >
            Check
          </button>
        </div>
      )}

      {/* Result feedback */}
      {result === 'correct' && (
        <Card className="mt-4 text-center animate-fade-in-up">
          <p className="text-green-400 font-semibold text-lg">Correct!</p>
          {explanation && (
            <p className="text-sm text-text-secondary mt-2 bg-surface-inset rounded-lg px-3 py-2">
              {explanation}
            </p>
          )}
        </Card>
      )}

      {result === 'wrong' && (
        <Card className="mt-4 text-center animate-fade-in-up">
          <p className="text-red-400 font-semibold mb-2">Not quite</p>
          <p className="text-sm text-text-secondary mb-1">Correct answer:</p>
          <p className="text-green-400 font-medium text-lg">{correctAnswer}</p>
          {explanation && (
            <p className="text-sm text-text-secondary mt-2 bg-surface-inset rounded-lg px-3 py-2">
              {explanation}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
