'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { OnboardingWord } from '@/lib/onboarding/data';

interface QuizCardProps {
  word: OnboardingWord;
  languageName: string;
  onAnswer: (correct: boolean, attempts: number) => void;
  promptText?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizCard({ word, languageName, onAnswer, promptText }: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const options = useMemo(
    () => shuffle([word.meaningEn, ...word.distractors]),
    [word]
  );

  const handleSelect = (option: string) => {
    if (isCorrect) return;

    setSelected(option);
    const correct = option === word.meaningEn;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (correct) {
      setIsCorrect(true);
      setTimeout(() => onAnswer(true, newAttempts), 800);
    } else {
      setShowHint(true);
      // Reset selection after shake animation
      setTimeout(() => setSelected(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center px-6 gap-6 w-full">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-text-secondary uppercase tracking-widest"
      >
        {promptText || 'Quick quiz'}
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-center"
      >
        {word.text}
      </motion.h2>

      {word.romanization && (
        <p className="text-lg text-text-secondary -mt-4">{word.romanization}</p>
      )}

      <p className="text-text-secondary">What does this mean?</p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {options.map((option) => {
          const isThis = selected === option;
          const correct = option === word.meaningEn;
          const showGreen = isThis && correct;
          const showRed = isThis && !correct;

          return (
            <motion.button
              key={option}
              animate={
                showRed
                  ? { x: [0, -10, 10, -10, 10, 0] }
                  : showGreen
                    ? { scale: [1, 1.05, 1] }
                    : {}
              }
              transition={{ duration: 0.4 }}
              onClick={() => handleSelect(option)}
              disabled={isCorrect}
              className={`w-full py-4 px-6 rounded-xl text-lg font-medium text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent-default focus-visible:outline-none ${
                showGreen
                  ? 'bg-green-600 text-white'
                  : showRed
                    ? 'bg-red-600 text-white'
                    : 'bg-card-surface border border-card-border hover:border-white/20 active:bg-white/10'
              }`}
            >
              {option}
              {showGreen && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="float-right"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {showHint && !isCorrect && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-amber-400 text-sm text-center"
        >
          Remember: it sounds like &ldquo;{word.keyword}&rdquo;
        </motion.p>
      )}

      {isCorrect && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-green-400 text-center font-medium"
        >
          See? You know {languageName} now.
        </motion.p>
      )}
    </div>
  );
}
