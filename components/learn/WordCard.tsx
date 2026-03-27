'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { playWordPronunciation } from '@/lib/audio';

interface WordCardProps {
  text: string;
  romanization?: string | null;
  meaningEn: string;
  partOfSpeech: string;
  wordId: string;
  audioUrl?: string | null;
  languageCode?: string;
  onContinue: () => void;
}

export function WordCard({ text, romanization, meaningEn, partOfSpeech, wordId, audioUrl, languageCode, onContinue }: WordCardProps) {
  // Auto-play pronunciation on mount / word change (ref guard prevents StrictMode double-play)
  const hasAutoPlayed = useRef(false);
  useEffect(() => {
    if (!hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      playWordPronunciation(wordId, { audioUrl, text, languageCode: languageCode as import('@/types/audio').SupportedLanguageCode | undefined }).catch(() => {});
    }
  }, [wordId, audioUrl, text, languageCode]);

  return (
    <Card className="text-center py-12 animate-slide-up" onClick={onContinue}>
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
      <div className="w-12 h-px bg-card-border mx-auto my-4" />
      <p className="text-xl text-foreground">{meaningEn}</p>
      <p className="text-sm text-text-secondary mt-8">Tap to continue</p>
    </Card>
  );
}
