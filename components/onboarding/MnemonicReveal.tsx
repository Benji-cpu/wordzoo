'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { OnboardingWord } from '@/lib/onboarding/data';

export type MnemonicPhase = 'keyword' | 'image' | 'caption' | 'complete';

interface MnemonicRevealProps {
  word: OnboardingWord;
  phase: MnemonicPhase;
}

export default function MnemonicReveal({ word, phase }: MnemonicRevealProps) {
  const showKeyword = phase === 'keyword' || phase === 'image' || phase === 'caption' || phase === 'complete';
  const showImage = phase === 'image' || phase === 'caption' || phase === 'complete';
  const showCaption = phase === 'caption' || phase === 'complete';

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {showKeyword && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-text-secondary text-sm mb-1">It sounds like...</p>
          <p className="text-2xl font-bold text-amber-400">&ldquo;{word.keyword}&rdquo;</p>
          <p className="text-text-secondary text-sm mt-1">{word.phoneticLink}</p>
        </motion.div>
      )}

      {showImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full max-w-sm aspect-square relative rounded-2xl overflow-hidden"
        >
          <Image
            src={word.imageUrl}
            alt={word.sceneDescription}
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      )}

      {showCaption && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-foreground/80 text-center max-w-sm leading-relaxed"
        >
          {word.sceneDescription}
        </motion.p>
      )}
    </div>
  );
}
