'use client';

import { useEffect, useRef } from 'react';
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

export function WordCard({
  text,
  romanization,
  meaningEn,
  partOfSpeech,
  wordId,
  audioUrl,
  languageCode,
  informalText,
  onContinue,
}: WordCardProps) {
  // Auto-play pronunciation on mount / word change
  const hasAutoPlayed = useRef(false);
  const prevWordId = useRef(wordId);

  if (prevWordId.current !== wordId) {
    prevWordId.current = wordId;
    hasAutoPlayed.current = false;
  }

  useEffect(() => {
    const play = () => {
      if (hasAutoPlayed.current) return;
      hasAutoPlayed.current = true;
      playWordPronunciation(wordId, {
        audioUrl,
        text,
        languageCode: languageCode as import('@/types/audio').SupportedLanguageCode | undefined,
      }).catch(() => {});
    };

    if (isAudioUnlocked()) {
      play();
      return;
    }

    return onAudioUnlocked(play);
  }, [wordId, audioUrl, text, languageCode]);

  return (
    <div
      className="flex flex-col items-center justify-center text-center flex-1 min-h-0 py-8 px-4 cursor-pointer animate-spring-in"
      onClick={onContinue}
    >
      <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)] mb-5">
        {partOfSpeech}
      </p>

      <h2
        className="font-display text-[color:var(--color-fox-primary)] leading-[0.95] mb-3"
        style={{ fontSize: 'clamp(2.75rem, 9.5vw, 4.25rem)' }}
      >
        {text}
      </h2>

      {romanization && (
        <p className="text-[15px] font-semibold text-[color:var(--text-secondary)] tracking-wide mb-4">
          {romanization}
        </p>
      )}

      <div onClick={(e) => e.stopPropagation()} className="mb-2">
        <PronunciationButton
          wordId={wordId}
          audioUrl={audioUrl}
          text={text}
          languageCode={languageCode}
          size={28}
        />
      </div>

      <div className="w-10 h-px bg-[color:var(--border-default)] mx-auto my-6" aria-hidden />

      <p className="text-[19px] font-semibold text-[color:var(--foreground)] leading-snug">
        {meaningEn}
      </p>

      {informalText && (
        <p className="mt-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-fox-soft)] text-[var(--color-fox-deep)] text-[11.5px] font-bold">
            Casual: {informalText}
          </span>
        </p>
      )}

      <p className="text-[12px] font-semibold text-[color:var(--text-secondary)] mt-10 animate-pulse">
        Tap to continue
      </p>
    </div>
  );
}
