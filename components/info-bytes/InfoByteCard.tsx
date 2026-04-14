'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { InfoByteDifficulty } from '@/types/database';

const DIFFICULTIES: { value: InfoByteDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Med' },
  { value: 'hard', label: 'Hard' },
];

const STORAGE_KEY = 'wordzoo-infobyte-difficulty';

function formatCategory(category: string): string {
  return category
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

interface InfoByteCardProps {
  category: string;
  topicSummary: string;
  easyTarget: string;
  easyEnglish: string;
  mediumTarget: string;
  mediumEnglish: string;
  hardTarget: string;
  hardEnglish: string;
}

export function InfoByteCard({
  category,
  topicSummary,
  easyTarget,
  easyEnglish,
  mediumTarget,
  mediumEnglish,
  hardTarget,
  hardEnglish,
}: InfoByteCardProps) {
  const [difficulty, setDifficulty] = useState<InfoByteDifficulty>('easy');
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'easy' || saved === 'medium' || saved === 'hard') {
      setDifficulty(saved);
    }
  }, []);

  function handleDifficultyChange(d: InfoByteDifficulty) {
    setDifficulty(d);
    setRevealed(false);
    localStorage.setItem(STORAGE_KEY, d);
  }

  const targetText = difficulty === 'easy' ? easyTarget : difficulty === 'medium' ? mediumTarget : hardTarget;
  const englishText = difficulty === 'easy' ? easyEnglish : difficulty === 'medium' ? mediumEnglish : hardEnglish;

  const targetSentences = splitSentences(targetText);
  const englishSentences = splitSentences(englishText);
  const canInterleave = targetSentences.length > 0 && targetSentences.length === englishSentences.length;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Daily Dose</span>
          <Badge>{formatCategory(category)}</Badge>
        </div>

        {/* Difficulty toggle */}
        <div className="flex rounded-lg overflow-hidden border border-card-border">
          {DIFFICULTIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleDifficultyChange(value)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                difficulty === value
                  ? 'bg-accent-default text-white'
                  : 'bg-card-surface text-text-secondary hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Topic summary */}
      <p className="text-xs text-text-secondary mb-3">{topicSummary}</p>

      {/* Interleaved sentences */}
      {canInterleave ? (
        <div className="space-y-2.5">
          {targetSentences.map((sentence, i) => (
            <div key={i}>
              <p className="text-accent-id text-sm leading-relaxed">{sentence}</p>
              {revealed && (
                <p className="text-xs text-text-secondary leading-relaxed mt-0.5 animate-fade-in">
                  {englishSentences[i]}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <p className="text-accent-id text-sm leading-relaxed whitespace-pre-line">
            {targetText}
          </p>
          {revealed && (
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line mt-2 animate-fade-in">
              {englishText}
            </p>
          )}
        </div>
      )}

      {/* Toggle translation */}
      <button
        onClick={() => setRevealed(!revealed)}
        className="w-full mt-3 py-2 text-xs font-medium text-text-secondary bg-surface-inset rounded-lg hover:text-foreground transition-colors"
      >
        {revealed ? 'Hide translation' : 'Tap to reveal English translation'}
      </button>
    </Card>
  );
}
