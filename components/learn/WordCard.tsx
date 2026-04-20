'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { playWordPronunciation, isAudioUnlocked, onAudioUnlocked } from '@/lib/audio';

interface WordCardProps {
  text: string;
  romanization?: string | null;
  meaningEn: string;
  partOfSpeech: string;
  wordId: string;
  audioUrl?: string | null;
  languageCode?: string;
  informalText?: string | null;
  onContinue: () => void;
}

export function WordCard({ text, romanization, meaningEn, partOfSpeech, wordId, audioUrl, languageCode, informalText, onContinue }: WordCardProps) {
  // Auto-play pronunciation on mount / word change
  const hasAutoPlayed = useRef(false);
  const prevWordId = useRef(wordId);

  // Reset autoplay flag when word changes
  if (prevWordId.current !== wordId) {
    prevWordId.current = wordId;
    hasAutoPlayed.current = false;
  }

  useEffect(() => {
    const play = () => {
      if (hasAutoPlayed.current) return;
      hasAutoPlayed.current = true;
      playWordPronunciation(wordId, { audioUrl, text, languageCode: languageCode as import('@/types/audio').SupportedLanguageCode | undefined }).catch(() => {});
    };

    if (isAudioUnlocked()) {
      play();
      return;
    }

    // Subscribe to unlock event — play when user first interacts
    return onAudioUnlocked(play);
  }, [wordId, audioUrl, text, languageCode]);

  return (
    <Card className="text-center animate-slide-up flex flex-col items-center justify-center min-h-[60vh] py-8" onClick={onContinue}>
      <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">
        {partOfSpeech}
      </p>
      <h2 className="text-4xl font-bold text-accent-id mb-2">{text}</h2>
      {romanization && (
        <p className="text-lg text-text-secondary mb-4">{romanization}</p>
      )}
      <div onClick={(e) => e.stopPropagation()}>
        <PronunciationButton wordId={wordId} audioUrl={audioUrl} text={text} languageCode={languageCode} />
      </div>
      <div className="w-12 h-px bg-card-border mx-auto my-6" />
      <p className="text-xl text-foreground">{meaningEn}</p>
      {informalText && (
        <p className="text-sm text-text-secondary mt-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-id/10 text-accent-id text-xs font-medium">
            Casual: {informalText}
          </span>
        </p>
      )}
      <p className="text-sm text-text-secondary mt-8">Tap to continue</p>
    </Card>
  );
}
