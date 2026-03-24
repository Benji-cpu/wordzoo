'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import type { ScenePatternExercise } from '@/types/database';

interface PatternExerciseProps {
  exercise: ScenePatternExercise;
  onCorrect: () => void;
}

export function PatternExercise({ exercise, onCorrect }: PatternExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);

  const options = useShuffled(exercise.correct_answer, exercise.distractors, exercise.prompt);

  const handleSelect = useCallback((option: string) => {
    if (selected) return;
    setSelected(option);
    setShowExplanation(false);
    const correct = option === exercise.correct_answer;
    setIsCorrect(correct);

    if (correct) {
      setTimeout(onCorrect, 800);
    } else {
      setTimeout(() => {
        setSelected(exercise.correct_answer);
        setIsCorrect(true);
        setTimeout(onCorrect, 800);
      }, 1000);
    }
  }, [selected, exercise.correct_answer, onCorrect]);

  // Highlight the blank in the prompt
  const promptParts = exercise.prompt.split('___');

  return (
    <div className="animate-slide-up">
      {/* Pattern template */}
      <Card className="mb-4 text-center">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Pattern</p>
        <p className="text-xl font-bold text-accent-id">{exercise.pattern_template}</p>
        <p className="text-sm text-text-secondary mt-1">{exercise.pattern_en}</p>
        {showExplanation && exercise.explanation && (
          <p className="text-sm text-text-secondary mt-3 bg-white/5 rounded-lg px-3 py-2">
            {exercise.explanation}
          </p>
        )}
      </Card>

      {/* Fill-in prompt */}
      <p className="text-center text-sm text-text-secondary mb-2">Fill in the blank:</p>
      <p className="text-center text-lg font-medium text-foreground mb-1">
        {promptParts[0]}
        <span className={`inline-block min-w-[3ch] border-b-2 mx-1 ${
          selected
            ? isCorrect ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'
            : 'border-accent-id/50'
        }`}>
          {selected || '\u00A0___\u00A0'}
        </span>
        {promptParts[1]}
      </p>
      {exercise.hint_en && (
        <p className="text-center text-sm text-text-secondary mb-4">{exercise.hint_en}</p>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {options.map((option) => {
          let className =
            'min-h-[44px] px-4 py-3 rounded-xl text-center font-medium transition-all border ';

          if (selected === option && isCorrect) {
            className += 'bg-green-500/20 border-green-500 text-green-400 scale-[1.02]';
          } else if (selected === option && !isCorrect) {
            className += 'bg-red-500/20 border-red-500 text-red-400';
          } else if (selected && option === exercise.correct_answer) {
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
  const all = [correct, ...distractors.slice(0, 3)];
  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return all
    .map((item, i) => ({ item, sort: (hash * (i + 1) * 31) % 1000 }))
    .sort((a, b) => a.sort - b.sort)
    .map((x) => x.item);
}
