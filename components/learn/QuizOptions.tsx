'use client';

import { useState, useCallback } from 'react';
import { PronunciationButton } from '@/components/audio/PronunciationButton';

interface QuizOptionsProps {
  wordText: string;
  wordId: string;
  correctAnswer: string;
  distractors: string[];
  onCorrect: () => void;
  onAnswer?: (correct: boolean) => void;
}

export function QuizOptions({ wordText, wordId, correctAnswer, distractors, onCorrect, onAnswer }: QuizOptionsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Shuffle options deterministically based on wordText
  const options = useShuffled(correctAnswer, distractors, wordText);

  const handleSelect = useCallback((option: string) => {
    if (selected) return; // already answered
    setSelected(option);
    const correct = option === correctAnswer;
    setIsCorrect(correct);
    onAnswer?.(correct);

    if (correct) {
      setTimeout(onCorrect, 600);
    } else {
      // Show correct answer after a beat then proceed
      setTimeout(() => {
        setSelected(correctAnswer);
        setIsCorrect(true);
        setTimeout(onCorrect, 600);
      }, 800);
    }
  }, [selected, correctAnswer, onCorrect]);

  return (
    <div className="animate-slide-up">
      <p className="text-center text-text-secondary text-sm mb-2">
        What does this mean?
      </p>
      <div className="flex items-center justify-center gap-1 mb-6">
        <p className="text-2xl font-bold text-accent-id">{wordText}</p>
        <div onClick={(e) => e.stopPropagation()}>
          <PronunciationButton wordId={wordId} size={20} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          let className =
            'min-h-[44px] px-4 py-3 rounded-xl text-center font-medium transition-all border ';

          if (selected === option && isCorrect) {
            className += 'bg-green-500/20 border-green-500 text-green-400 scale-[1.02]';
          } else if (selected === option && !isCorrect) {
            className += 'bg-red-500/20 border-red-500 text-red-400';
          } else if (selected && option === correctAnswer) {
            className += 'bg-green-500/20 border-green-500 text-green-400';
          } else {
            className += 'bg-card-surface border-card-border text-foreground hover:bg-white/10 active:scale-95';
          }

          return (
            <button
              key={option}
              className={className}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useShuffled(correct: string, distractors: string[], seed: string): string[] {
  // Simple deterministic shuffle based on seed string
  const all = [correct, ...distractors.slice(0, 3)];
  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return all
    .map((item, i) => ({ item, sort: (hash * (i + 1) * 31) % 1000 }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.item);
}
