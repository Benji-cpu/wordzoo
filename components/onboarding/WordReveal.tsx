'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { OnboardingWord } from '@/lib/onboarding/data';
import MnemonicReveal, { type MnemonicPhase } from './MnemonicReveal';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { playWordPronunciation, isAudioUnlocked } from '@/lib/audio';
import { useReveal, RevealStep } from '@/components/ui/Reveal';

interface WordRevealProps {
  word: OnboardingWord;
  wordNumber: number;
  /**
   * The demo's own hand-tuned curve, passed straight through rather than derived
   * from `paceFor`. Three words is too short a run for the general acceleration to
   * read as anything but uneven, and this is the one sequence a stranger is judged
   * on — so it keeps the pacing it was tuned to.
   */
  speedMultiplier: number;
  onComplete: () => void;
  languageCode?: string;
}

export default function WordReveal({
  word,
  wordNumber,
  speedMultiplier,
  onComplete,
  languageCode,
}: WordRevealProps) {
  const { beat, ready, containerProps, affordanceRef } = useReveal<HTMLButtonElement>({
    scale: speedMultiplier,
    resetKey: word,
  });

  useEffect(() => {
    if (!isAudioUnlocked()) return;
    playWordPronunciation(word.text, {
      audioUrl: word.audioUrl,
      text: word.romanization || word.text,
      languageCode: languageCode as import('@/types/audio').SupportedLanguageCode | undefined,
    }).catch(() => {});
  }, [word, languageCode]);

  // Six beats: meaning, bridge, keyword, image, caption, ready.
  const mnemonicPhase: MnemonicPhase | null =
    beat >= 5 ? 'complete' :
    beat === 4 ? 'image' :
    beat === 3 ? 'keyword' :
    null;

  return (
    <div className="flex flex-col items-center px-6 gap-6 w-full" {...containerProps}>
      {/* Word number badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-xs font-medium text-text-secondary uppercase tracking-widest"
      >
        Word {wordNumber} of 3
      </motion.div>

      {/* Foreign word */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-5xl font-bold">{word.text}</h2>
        {word.romanization && (
          <p className="text-xl text-text-secondary mt-2">{word.romanization}</p>
        )}
        <PronunciationButton
          wordId={word.text}
          audioUrl={word.audioUrl}
          text={word.romanization || word.text}
          languageCode={languageCode}
        />
      </motion.div>

      {/* English meaning */}
      <RevealStep show={beat >= 1}>
        <p className="text-2xl text-foreground/80">= &ldquo;{word.meaningEn}&rdquo;</p>
      </RevealStep>

      {/* Bridge text */}
      <RevealStep show={beat >= 2} from="fade">
        <p className="text-sm text-text-secondary uppercase tracking-widest">
          Here&apos;s how you&apos;ll remember it:
        </p>
      </RevealStep>

      {/* Mnemonic reveal */}
      {mnemonicPhase && <MnemonicReveal word={word} phase={mnemonicPhase} />}

      {/* Tap to continue */}
      {ready && (
        <motion.button
          ref={affordanceRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          onClick={onComplete}
          className="mt-4 mb-2 scroll-mb-6 px-8 py-4 text-text-secondary text-sm cursor-pointer animate-pulse"
        >
          Tap to continue ›
        </motion.button>
      )}
    </div>
  );
}
