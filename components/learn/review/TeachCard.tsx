'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { SpeakAnswer, isSpeechAnswerAvailable } from '@/components/audio/SpeakAnswer';
import { isAudioUnlocked } from '@/lib/audio/pronunciation';
import { AudioButton } from './AudioButton';
import { MnemonicBlock } from './MnemonicBlock';
import { useItemAudio } from './useItemAudio';
import type { ItemView } from './item-view';

interface TeachCardProps {
  view: ItemView;
  languageCode: string | null;
  onContinue: () => void;
}

/**
 * A learning item that has not been seen for weeks is shown again before it is
 * asked: the word, its audio, the memory picture, and "say it once". Nothing
 * here is graded or recorded; its recall comes a few cards later.
 */
export function TeachCard({ view, languageCode, onContinue }: TeachCardProps) {
  const { play, playing } = useItemAudio(view, languageCode);
  const [canSpeak, setCanSpeak] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    setCanSpeak(Boolean(languageCode) && isSpeechAnswerAvailable());
    if (started.current) return;
    started.current = true;
    if (isAudioUnlocked()) void play();
    // once per card
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <Card className="text-center">
        <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Let&apos;s look at this one again</p>
        <div className="flex items-center justify-center gap-3">
          <h2 className="font-display text-[color:var(--color-fox-primary)] leading-[1.05]" style={{ fontSize: 'clamp(1.75rem, 7vw, 2.5rem)' }}>
            {view.text}
          </h2>
          <AudioButton onPlay={() => void play()} playing={playing} label="Play audio" />
        </div>
        {view.romanization && <p className="mt-1 text-sm text-text-secondary">{view.romanization}</p>}
        <p className="mt-2 text-lg text-foreground font-medium">{view.meaning}</p>
        {view.literal && <p className="mt-1 text-sm text-text-secondary italic">Literally: &ldquo;{view.literal}&rdquo;</p>}
        <MnemonicBlock view={view} withWords={view.kind === 'phrase'} />
      </Card>

      {canSpeak && languageCode && (
        <div className="py-1">
          <SpeakAnswer languageCode={languageCode} onResult={() => {}} />
          <p className="mt-1 text-center text-xs text-text-secondary">Say it once. Just for practice, nothing is marked.</p>
        </div>
      )}

      <ThumbButton variant="primary" size="lg" onClick={onContinue}>
        Continue
      </ThumbButton>
    </div>
  );
}
