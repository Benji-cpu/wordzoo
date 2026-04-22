'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { Celebration } from '@/components/ui/Celebration';
import { Fox } from '@/components/mascot/Fox';
import { PhraseBreakdown } from '@/components/learn/PhraseBreakdown';
import { useSound } from '@/lib/hooks/useSound';
import { useHaptic } from '@/lib/hooks/useHaptic';
import { useXP, XP_AMOUNTS } from '@/lib/hooks/useXP';
import type { ScenePhraseWithMnemonics } from '@/types/database';

interface PhraseQuizProps {
  promptText: string;
  correctAnswer: string;
  distractors: string[];
  onCorrect: () => void;
  /** If provided and the phrase has at least one word with a mnemonic, an inline
   *  "Break it down" affordance is offered after a correct answer. */
  phrase?: ScenePhraseWithMnemonics;
}

export function PhraseQuiz({
  promptText,
  correctAnswer,
  distractors,
  onCorrect,
  phrase,
}: PhraseQuizProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [xpPopped, setXpPopped] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play } = useSound();
  const { award } = useXP();
  const { trigger } = useHaptic();

  const breakdownAvailable = !!phrase && phrase.words.some((w) => w.keyword_text !== null);

  const options = useShuffled(correctAnswer, distractors, promptText);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const scheduleAdvance = useCallback((delay: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(onCorrect, delay);
  }, [onCorrect]);

  const cancelAdvance = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

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
        // Hold longer when a breakdown is available so the user has time to notice the affordance.
        scheduleAdvance(breakdownAvailable ? 2200 : 1100);
      } else {
        play('incorrect');
        trigger('error');
        setTimeout(() => {
          setSelected(correctAnswer);
          setIsCorrect(true);
          setCelebrate(true);
          play('reveal');
          scheduleAdvance(breakdownAvailable ? 2200 : 1300);
        }, 900);
      }
    },
    [selected, correctAnswer, play, trigger, award, breakdownAvailable, scheduleAdvance],
  );

  const handleExpandBreakdown = useCallback(() => {
    cancelAdvance();
    setShowBreakdown(true);
  }, [cancelAdvance]);

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

      {showBreakdown && phrase ? (
        <div className="pb-2">
          <PhraseBreakdown phrase={phrase} embedded />
          <button
            type="button"
            onClick={onCorrect}
            className="mt-4 w-full rounded-2xl bg-[color:var(--accent-indonesian)] text-white font-extrabold py-3.5 shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-indonesian)_35%,transparent)] active:scale-[0.97] transition-transform"
          >
            Continue →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-2">
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

          {selected && isCorrect && breakdownAvailable && (
            <button
              type="button"
              onClick={handleExpandBreakdown}
              className="mt-1 mx-auto text-sm font-semibold text-[color:var(--accent-indonesian)] underline underline-offset-4 py-1 animate-fade-in"
            >
              Break it down →
            </button>
          )}
        </div>
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
