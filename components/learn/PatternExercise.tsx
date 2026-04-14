'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import type { ScenePatternExercise } from '@/types/database';

interface PatternExerciseProps {
  exercise: ScenePatternExercise;
  onCorrect: () => void;
  userName?: string | null;
}

export function PatternExercise({ exercise, onCorrect, userName }: PatternExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showPattern, setShowPattern] = useState(false);

  // Replace {name} placeholder with user's first name (fallback to "Adi")
  const firstName = userName?.split(' ')[0] || 'Adi';
  const prompt = useMemo(() => exercise.prompt.replace(/\{name\}/g, firstName), [exercise.prompt, firstName]);
  const hintEn = useMemo(() => exercise.hint_en?.replace(/\{name\}/g, firstName) ?? null, [exercise.hint_en, firstName]);

  const options = useShuffled(exercise.correct_answer, exercise.distractors, exercise.prompt);

  const handleSelect = useCallback((option: string) => {
    if (selected) return;
    setSelected(option);
    const correct = option === exercise.correct_answer;
    setIsCorrect(correct);

    if (correct) {
      setTimeout(() => setShowPattern(true), 400);
      setTimeout(onCorrect, 1600);
    } else {
      setTimeout(() => {
        setSelected(exercise.correct_answer);
        setIsCorrect(true);
        setTimeout(() => setShowPattern(true), 400);
        setTimeout(onCorrect, 1600);
      }, 1000);
    }
  }, [selected, exercise.correct_answer, onCorrect]);

  // Highlight the blank in the prompt
  const promptParts = prompt.split('___');

  return (
    <div className="animate-slide-up">
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
      {hintEn && (
        <p className="text-center text-sm text-text-secondary mb-4">{hintEn}</p>
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

      {/* Pattern reveal after answer */}
      {showPattern && (
        <Card className="mt-4 text-center animate-fade-in-up">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Pattern</p>
          <p className="text-xl font-bold text-accent-id">{exercise.pattern_template}</p>
          <p className="text-sm text-text-secondary mt-1">{exercise.pattern_en}</p>
          {exercise.explanation && (
            <p className="text-sm text-text-secondary mt-3 bg-surface-inset rounded-lg px-3 py-2">
              {exercise.explanation}
            </p>
          )}
        </Card>
      )}
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
