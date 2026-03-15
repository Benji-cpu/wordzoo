'use client';

import { motion } from 'framer-motion';
import type { OnboardingWord } from '@/lib/onboarding/data';
import type { QuizAnswer } from '@/lib/onboarding/state';

interface OnboardingCompleteProps {
  languageName: string;
  words: OnboardingWord[];
  elapsedSeconds: number;
  quizResults: QuizAnswer[];
  onKeepLearning: () => void;
  onMaybeLater: () => void;
}

export default function OnboardingComplete({
  languageName,
  words,
  elapsedSeconds,
  quizResults,
  onKeepLearning,
  onMaybeLater,
}: OnboardingCompleteProps) {
  const totalAttempts = quizResults.reduce((sum, q) => sum + q.attempts, 0);
  const perfectScore = totalAttempts === quizResults.length;

  return (
    <div className="flex flex-col items-center px-6 gap-6 w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-6xl"
      >
        {perfectScore ? '🎉' : '🙌'}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-center"
      >
        You just learned {words.length} {languageName} words
        {elapsedSeconds < 60 ? ' in under a minute' : ` in ${Math.round(elapsedSeconds / 60)} minutes`}.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-text-secondary text-center"
      >
        The keyword method makes words impossible to forget.
      </motion.p>

      {/* Mini recap grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-3 gap-3 w-full max-w-sm"
      >
        {words.map((word) => (
          <div
            key={word.id}
            className="flex flex-col items-center gap-1 rounded-xl bg-card-surface border border-card-border p-3"
          >
            <span className="text-lg font-bold">{word.text}</span>
            {word.romanization && (
              <span className="text-xs text-text-secondary">{word.romanization}</span>
            )}
            <span className="text-sm text-text-secondary">{word.meaningEn}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onKeepLearning}
        className="w-full max-w-sm py-4 rounded-xl bg-green-600 text-white text-lg font-semibold hover:bg-green-500 active:bg-green-700 transition-colors cursor-pointer"
      >
        Keep Learning
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onMaybeLater}
        className="text-text-secondary text-sm hover:text-foreground/80 transition-colors cursor-pointer"
      >
        Maybe later
      </motion.button>
    </div>
  );
}
