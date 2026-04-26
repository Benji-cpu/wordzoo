'use client';

import { useState, useCallback } from 'react';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { Celebration } from '@/components/ui/Celebration';
import { Fox } from '@/components/mascot/Fox';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { useXP, XP_AMOUNTS } from '@/lib/hooks/useXP';
import type { ScenePhraseWithMnemonics } from '@/types/database';

interface PhraseQuizProps {
  promptText: string;
  correctAnswer: string;
  distractors: string[];
  onCorrect: () => void;
  /** Reserved for future use — quiz no longer surfaces a post-quiz breakdown
   *  affordance because users found it fleeting and redundant with the
   *  pre-quiz PhraseCard. Left in the prop interface for callers. */
  phrase?: ScenePhraseWithMnemonics;
}

export function PhraseQuiz({
  promptText,
  correctAnswer,
  distractors,
  onCorrect,
}: PhraseQuizProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [xpPopped, setXpPopped] = useState(false);
  const { play } = useSound();
  const { award } = useXP();
  const { trigger } = useHaptic();

  const options = useShuffled(correctAnswer, distractors, promptText);

  const handleSelect = useCallback(
    (option: string) => {
      if (selected) return;
      setSelected(option);
      const correct = option === correctAnswer;
      setIsCorrect(correct);

      if (correct) {
        setCelebrate(true);
        setXpPopped(true);
        play('correct');
        trigger('success');
        void award('phrase_complete');
      } else {
        play('incorrect');
        trigger('error');
        setTimeout(() => {
          setSelected(correctAnswer);
          setIsCorrect(true);
          setCelebrate(true);
          play('reveal');
        }, 900);
      }
    },
    [selected, correctAnswer, play, trigger, award],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center py-6 relative">
        <p className="text-center text-text-secondary text-sm mb-2">
          How do you say...
        </p>
        <p className="text-center text-2xl font-bold text-foreground">{promptText}</p>
        {selected ? (
          <div className="mt-4 animate-spring-in">
            <Fox
              pose={isCorrect ? 'celebrating' : 'thinking'}
              size="sm"
            />
          </div>
        ) : null}
        <Celebration active={celebrate && !!isCorrect} variant="correct" />
        {xpPopped && isCorrect ? (
          <span
            aria-hidden
            className="absolute top-10 right-6 animate-xp-tick text-base font-bold text-[var(--color-fox-primary)]"
          >
            +{XP_AMOUNTS.phrase_complete} XP
          </span>
        ) : null}
      </div>

      {(() => {
        const longest = options.reduce((m, o) => Math.max(m, o.length), 0);
        const useGrid = longest <= 16;
        return (
        <div className={useGrid ? 'grid grid-cols-2 gap-3 pb-2' : 'flex flex-col gap-3 pb-2'}>
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
                className={`${extra} whitespace-normal text-base leading-snug h-auto py-3`}
                onClick={() => handleSelect(option)}
              >
                {option}
              </ThumbButton>
            );
          })}

          {selected && isCorrect && (
            <div className={`flex flex-col gap-2 mt-2 animate-fade-in ${useGrid ? 'col-span-2' : ''}`}>
              <button
                type="button"
                onClick={onCorrect}
                className="w-full rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold py-3.5 shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-indonesian)_35%,transparent)] active:scale-[0.97] transition-transform"
              >
                Continue →
              </button>
            </div>
          )}
        </div>
        );
      })()}
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
