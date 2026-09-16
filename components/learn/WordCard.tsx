'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { playWordPronunciation, isAudioUnlocked, onAudioUnlocked } from '@/lib/audio';
import { useReveal, RevealStep } from '@/components/ui/Reveal';
import { ladder } from '@/lib/ui/pace';

type Part = { gap: number; node: ReactNode };

interface WordCardProps {
  text: string;
  romanization?: string | null;
  meaningEn: string;
  partOfSpeech: string;
  wordId: string;
  audioUrl?: string | null;
  languageCode?: string;
  informalText?: string | null;
  /**
   * How many words into the scene this one is. The reveal shortens as it grows —
   * the first word of a sitting is taught, the fifth is merely shown.
   */
  unitIndex?: number;
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
  unitIndex = 0,
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

  const audioButton = (
    <div onClick={(e) => e.stopPropagation()} className="mb-2">
      <PronunciationButton
        wordId={wordId}
        audioUrl={audioUrl}
        text={text}
        languageCode={languageCode}
        size={28}
      />
    </div>
  );

  // Only what this word actually has gets a beat. A word with no romanization
  // should not sit through the pause where one would have appeared — that reads
  // as the app having stalled, which is exactly the feeling being designed out.
  // The audio button travels with the romanization so the reading order is the
  // one this card already had; with no romanization it belongs to the word itself.
  const parts: (Part | null)[] = [
    romanization
      ? {
          gap: 600,
          node: (
            <>
              <p className="text-[15px] font-semibold text-[color:var(--text-secondary)] tracking-wide mb-4">
                {romanization}
              </p>
              {audioButton}
            </>
          ),
        }
      : null,
    {
      gap: 700,
      node: (
        <>
          <div className="w-10 h-px bg-[color:var(--border-default)] mx-auto my-6" aria-hidden />
          <p className="text-[19px] font-semibold text-[color:var(--foreground)] leading-snug">
            {meaningEn}
          </p>
        </>
      ),
    },
    informalText
      ? {
          gap: 500,
          node: (
            <p className="mt-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-fox-soft)] text-[var(--color-fox-deep)] text-[11.5px] font-bold">
                Casual: {informalText}
              </span>
            </p>
          ),
        }
      : null,
  ];
  const beats = parts.filter((p): p is Part => p !== null);

  const { beat, ready, containerProps, affordanceRef } = useReveal<HTMLParagraphElement>({
    steps: ladder(...beats.map((p) => p.gap), 400),
    unitIndex,
    resetKey: wordId,
  });

  return (
    <div
      className="flex flex-col items-center justify-center text-center flex-1 min-h-0 py-8 px-4 cursor-pointer animate-spring-in"
      {...containerProps}
      onClick={() => {
        // A tap mid-reveal lands the rest (handled by containerProps); only a tap
        // once everything is on screen moves to the next word. Without this the
        // first impatient tap would skip the word entirely.
        if (ready) onContinue();
      }}
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

      {!romanization && audioButton}

      {beats.map((part, i) => (
        <RevealStep key={i} show={beat >= i + 1}>
          {part.node}
        </RevealStep>
      ))}

      {ready && (
        <p
          ref={affordanceRef}
          className="text-[12px] font-semibold text-[color:var(--text-secondary)] mt-10 scroll-mb-6 animate-pulse"
        >
          Tap to continue
        </p>
      )}
    </div>
  );
}
