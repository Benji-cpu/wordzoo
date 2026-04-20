'use client';

import { useState, useCallback } from 'react';

interface PhraseQuizProps {
  promptText: string;
  correctAnswer: string;
  distractors: string[];
  onCorrect: () => void;
}

export function PhraseQuiz({ promptText, correctAnswer, distractors, onCorrect }: PhraseQuizProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const options = useShuffled(correctAnswer, distractors, promptText);

  const handleSelect = useCallback((option: string) => {
    if (selected) return;
    setSelected(option);
    const correct = option === correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setTimeout(onCorrect, 1200);
    } else {
      setTimeout(() => {
        setSelected(correctAnswer);
        setIsCorrect(true);
        setTimeout(onCorrect, 1500);
      }, 1000);
    }
  }, [selected, correctAnswer, onCorrect]);

  return (
    <div className="animate-slide-up">
      <p className="text-center text-text-secondary text-sm mb-2">How do you say...</p>
      <p className="text-center text-xl font-bold text-foreground mb-6">{promptText}</p>
      <div className="space-y-3">
        {options.map((option) => {
          let className =
            'w-full min-h-[56px] px-4 py-3 rounded-xl text-center text-sm font-medium transition-all border flex items-center justify-center line-clamp-2 ';

          if (selected === option && isCorrect) {
            className += 'bg-green-500/20 border-green-500 text-green-400 scale-[1.02]';
          } else if (selected === option && !isCorrect) {
            className += 'bg-red-500/20 border-red-500 text-red-400';
          } else if (selected && option === correctAnswer) {
            className += 'bg-green-500/20 border-green-500 text-green-400';
          } else {
            className += 'bg-card-surface border-card-border text-foreground hover:bg-surface-inset active:scale-95';
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
  const all = [correct, ...distractors.slice(0, 3)];
  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return all
    .map((item, i) => ({ item, sort: (hash * (i + 1) * 31) % 1000 }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.item);
}
