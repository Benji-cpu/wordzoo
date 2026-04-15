'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { OnboardingWord } from '@/lib/onboarding/data';
import MnemonicReveal, { type MnemonicPhase } from './MnemonicReveal';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { playWordPronunciation, isAudioUnlocked } from '@/lib/audio';

interface WordRevealProps {
  word: OnboardingWord;
  wordNumber: number;
  speedMultiplier: number;
  onComplete: () => void;
  languageCode?: string;
}

type RevealPhase = 'word' | 'meaning' | 'bridge' | 'keyword' | 'image' | 'caption' | 'ready';

export default function WordReveal({ word, wordNumber, speedMultiplier, onComplete, languageCode }: WordRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('word');

  const t = useCallback((ms: number) => ms * speedMultiplier, [speedMultiplier]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Auto-play pronunciation (guarded by unlock state)
    if (isAudioUnlocked()) {
      playWordPronunciation(word.text, {
        text: word.romanization || word.text,
        languageCode: languageCode as import('@/types/audio').SupportedLanguageCode | undefined,
      }).catch(() => {});
    }

    timers.push(setTimeout(() => setPhase('meaning'), t(1000)));
    timers.push(setTimeout(() => setPhase('bridge'), t(2000)));
    timers.push(setTimeout(() => setPhase('keyword'), t(2500)));
    timers.push(setTimeout(() => setPhase('image'), t(3500)));
    timers.push(setTimeout(() => setPhase('caption'), t(4000)));
    timers.push(setTimeout(() => setPhase('ready'), t(4500)));

    return () => timers.forEach(clearTimeout);
  }, [word, t]);

  const showMeaning = phase !== 'word';
  const showBridge = phase !== 'word' && phase !== 'meaning';

  const mnemonicPhase: MnemonicPhase | null =
    phase === 'keyword' ? 'keyword' :
    phase === 'image' ? 'image' :
    phase === 'caption' || phase === 'ready' ? 'complete' :
    null;

  return (
    <div className="flex flex-col items-center px-6 gap-6 w-full">
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
          text={word.romanization || word.text}
          languageCode={languageCode}
        />
      </motion.div>

      {/* English meaning */}
      {showMeaning && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl text-foreground/80"
        >
          = &ldquo;{word.meaningEn}&rdquo;
        </motion.p>
      )}

      {/* Bridge text */}
      {showBridge && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-text-secondary uppercase tracking-widest"
        >
          Here&apos;s how you&apos;ll remember it:
        </motion.p>
      )}

      {/* Mnemonic reveal */}
      {mnemonicPhase && <MnemonicReveal word={word} phase={mnemonicPhase} />}

      {/* Tap to continue */}
      {phase === 'ready' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          onClick={onComplete}
          className="mt-4 px-8 py-4 text-text-secondary text-sm cursor-pointer animate-pulse"
        >
          Tap to continue ›
        </motion.button>
      )}
    </div>
  );
}
