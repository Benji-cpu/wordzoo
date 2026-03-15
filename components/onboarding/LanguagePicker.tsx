'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ONBOARDING_LANGUAGES, type OnboardingLanguage } from '@/lib/onboarding/data';

interface LanguagePickerProps {
  onSelect: (language: OnboardingLanguage) => void;
}

export default function LanguagePicker({ onSelect }: LanguagePickerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Preload all 9 mnemonic images on mount
  useEffect(() => {
    ONBOARDING_LANGUAGES.forEach((lang) => {
      lang.words.forEach((word) => {
        const img = new Image();
        img.src = word.imageUrl;
      });
    });
  }, []);

  const handleSelect = (language: OnboardingLanguage) => {
    if (selected) return; // prevent double-tap
    setSelected(language.code);
    setTimeout(() => onSelect(language), 400);
  };

  return (
    <div className="flex flex-col items-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-center mb-2"
      >
        Pick a language to try
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-text-secondary text-center mb-8"
      >
        You&apos;ll learn 3 words in under a minute.
      </motion.p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {ONBOARDING_LANGUAGES.map((lang, i) => {
          const isSelected = selected === lang.code;
          const isOther = selected !== null && !isSelected;

          return (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, x: -30 }}
              animate={{
                opacity: isOther ? 0.3 : 1,
                x: 0,
                scale: isSelected ? 1.05 : 1,
              }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              onClick={() => handleSelect(lang)}
              className="flex items-center gap-4 rounded-2xl bg-card-surface border border-card-border p-5 text-left transition-colors hover:border-white/20 active:bg-white/10 focus-visible:ring-2 focus-visible:ring-accent-default focus-visible:outline-none"
            >
              <span className="text-4xl">{lang.flagEmoji}</span>
              <div>
                <div className="text-lg font-semibold">{lang.name}</div>
                <div className="text-sm text-text-secondary">{lang.nativeName}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
