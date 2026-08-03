'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LearningGoal } from '@/lib/onboarding/state';

interface GoalPickProps {
  languageName: string;
  onSelect: (goal: LearningGoal) => void;
}

const GOALS: { value: LearningGoal; emoji: string; label: string; blurb: string }[] = [
  { value: 'trip', emoji: '✈️', label: "I'm taking a trip", blurb: 'Get usable fast, before a date' },
  { value: 'living', emoji: '🏠', label: "I'm living there", blurb: 'Handle daily life, not tourist phrases' },
  { value: 'family', emoji: '❤️', label: 'Someone I love speaks it', blurb: 'Partner, family, in-laws' },
  { value: 'work', emoji: '💼', label: 'Work or study', blurb: 'Colleagues, clients, a course' },
  { value: 'curiosity', emoji: '🎧', label: 'Just curious', blurb: 'No deadline, enjoying it' },
];

/**
 * One question, asked once, between language and the first word.
 *
 * It is here because the app had no idea why anyone was learning: onboarding
 * never asked, and the only goal primitive was a *trip* buried in settings,
 * which silently excludes a partner, heritage, work or moving abroad. A goal
 * the product can't see is a goal it can't help anyone reach.
 *
 * No skip button on purpose — it is one tap, and a goal the learner declined
 * to give is worth less than the friction saved.
 */
export default function GoalPick({ languageName, onSelect }: GoalPickProps) {
  const [selected, setSelected] = useState<LearningGoal | null>(null);

  const handleSelect = (goal: LearningGoal) => {
    if (selected) return; // prevent double-tap
    setSelected(goal);
    setTimeout(() => onSelect(goal), 400);
  };

  return (
    <div className="flex flex-col items-center px-6 w-full">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-center mb-2"
      >
        Why {languageName}?
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-text-secondary text-center mb-8"
      >
        So we can aim the lessons at something real.
      </motion.p>

      <div className="flex flex-col gap-2.5 w-full max-w-sm">
        {GOALS.map((goal, i) => {
          const isSelected = selected === goal.value;
          const isDimmed = selected !== null && !isSelected;
          return (
            <motion.button
              key={goal.value}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: isDimmed ? 0.35 : 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => handleSelect(goal.value)}
              disabled={selected !== null}
              className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-[16px] border transition-transform active:scale-[0.98] ${
                isSelected
                  ? 'border-[color:var(--accent-indonesian)] bg-[color:var(--accent-indonesian-soft)]'
                  : 'border-[color:var(--border-default)] bg-[color:var(--card-surface)]'
              }`}
            >
              <span aria-hidden className="text-2xl shrink-0">
                {goal.emoji}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-extrabold text-[color:var(--foreground)] leading-tight">
                  {goal.label}
                </span>
                <span className="block text-[12.5px] text-[color:var(--text-secondary)] mt-0.5">
                  {goal.blurb}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
