'use client';

import { useState, useCallback } from 'react';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { Celebration } from '@/components/ui/Celebration';
import { Fox } from '@/components/mascot/Fox';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { useXP, XP_AMOUNTS } from '@/lib/hooks/useXP';

interface QuizOptionsProps {
  wordText: string;
  wordId: string;
  correctAnswer: string;
  distractors: string[];
  onCorrect: () => void;
  onAnswer?: (correct: boolean) => void;
}

export function QuizOptions({
  wordText,
  wordId,
  correctAnswer,
  distractors,
  onCorrect,
  onAnswer,
}: QuizOptionsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [xpPopped, setXpPopped] = useState(false);
  const { play } = useSound();
  const { trigger } = useHaptic();
  const { award } = useXP();

  const options = useShuffled(correctAnswer, distractors, wordText);

  const handleSelect = useCallback(
    (option: string) => {
      if (selected) return;
      setSelected(option);
      const correct = option === correctAnswer;
      setIsCorrect(correct);
      onAnswer?.(correct);

      if (correct) {
        setCelebrate(true);
        setXpPopped(true);
        play('correct');
        trigger('success');
        void award('correct_answer');
        setTimeout(onCorrect, 1100);
      } else {
        play('incorrect');
        trigger('error');
        setTimeout(() => {
          setSelected(correctAnswer);
          setIsCorrect(true);
          setCelebrate(true);
          play('reveal');
          setTimeout(onCorrect, 1300);
        }, 900);
      }
    },
    [selected, correctAnswer, onCorrect, onAnswer, play, trigger, award],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Prompt area */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 relative">
        <p className="text-center text-text-secondary text-sm mb-2">
          What does this mean?
        </p>
        <div className="flex items-center justify-center gap-2">
          <p className="text-3xl font-bold text-[var(--color-fox-primary)]">
            {wordText}
          </p>
          <span
            onClick={(e) => e.stopPropagation()}
            className="inline-flex"
          >
            <PronunciationButton wordId={wordId} size={22} />
          </span>
        </div>

        {/* Inline fox moment on answer */}
        {selected ? (
          <div className="mt-4 animate-spring-in">
            <Fox
              pose={isCorrect ? 'celebrating' : 'thinking'}
              size="sm"
              aria-label={isCorrect ? 'Correct' : 'Try again'}
            />
          </div>
        ) : null}

        {/* Celebration burst — anchored at the center of the prompt area */}
        <Celebration active={celebrate && !!isCorrect} variant="correct" />

        {/* XP tick float-up */}
        {xpPopped && isCorrect ? (
          <span
            aria-hidden
            className="absolute top-10 right-6 animate-xp-tick text-base font-bold text-[var(--color-fox-primary)]"
          >
            +{XP_AMOUNTS.correct_answer} XP
          </span>
        ) : null}
      </div>

      {/* Answer options — always stacked, full-width on mobile;
          two-column on md+ for dense vocab quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
        {options.map((option) => {
          const isSelectedCorrect = selected === option && isCorrect;
          const isSelectedWrong = selected === option && isCorrect === false;
          const isRevealedCorrect =
            selected !== null && selected !== correctAnswer && option === correctAnswer;

          let variant: 'primary' | 'secondary' | 'success' | 'destructive' =
            'secondary';
          let extra = '';
          if (isSelectedCorrect || isRevealedCorrect) {
            variant = 'success';
            extra = 'animate-pop';
          } else if (isSelectedWrong) {
            variant = 'destructive';
            extra = 'animate-shake';
          }

          return (
            <ThumbButton
              key={option}
              variant={variant}
              size="md"
              haptic={false}
              sound={false}
              disabled={selected !== null && !isSelectedCorrect && !isSelectedWrong && !isRevealedCorrect}
              className={extra}
              onClick={() => handleSelect(option)}
            >
              {option}
            </ThumbButton>
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
