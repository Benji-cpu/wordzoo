'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { speakText, stopPlayback } from '@/lib/audio/pronunciation';
import type { SupportedLanguageCode } from '@/types/audio';
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
  languageCode?: SupportedLanguageCode;
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
  languageCode,
}: InfoByteCardProps) {
  const [difficulty, setDifficulty] = useState<InfoByteDifficulty>('easy');
  const [revealed, setRevealed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'easy' || saved === 'medium' || saved === 'hard') {
      setDifficulty(saved);
    }
    setCanSpeak(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  // Stop any in-flight narration when the card unmounts.
  useEffect(() => () => stopPlayback(), []);

  function handleDifficultyChange(d: InfoByteDifficulty) {
    setDifficulty(d);
    setRevealed(false);
    stopPlayback();
    setSpeaking(false);
    localStorage.setItem(STORAGE_KEY, d);
  }

  async function handleSpeak(text: string) {
    if (!languageCode) return;
    if (speaking) {
      stopPlayback();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    try {
      await speakText(text, languageCode);
    } catch {
      // Voice unavailable — silently ignore.
    } finally {
      setSpeaking(false);
    }
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
          {canSpeak && languageCode && (
            <button
              onClick={() => handleSpeak(targetText)}
              aria-label={speaking ? 'Stop reading aloud' : 'Read aloud'}
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                speaking
                  ? 'bg-accent-default text-white'
                  : 'text-text-secondary hover:text-foreground hover:bg-surface-inset'
              }`}
            >
              {speaking ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          )}
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
