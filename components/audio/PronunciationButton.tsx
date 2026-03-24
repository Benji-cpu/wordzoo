'use client';

import { useState, useCallback } from 'react';
import { playWordPronunciation, stopPlayback } from '@/lib/audio';

interface PronunciationButtonProps {
  wordId: string;
  audioUrl?: string | null;
  text?: string;
  languageCode?: string;
  size?: number;
  className?: string;
}

export function PronunciationButton({ wordId, audioUrl, text, languageCode, size = 24, className = '' }: PronunciationButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = useCallback(async () => {
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    try {
      await playWordPronunciation(wordId, { audioUrl, text, languageCode: languageCode as import('@/types/audio').SupportedLanguageCode | undefined });
    } catch {
      // Playback failed — silently ignore
    } finally {
      setIsPlaying(false);
    }
  }, [wordId, audioUrl, text, languageCode, isPlaying]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPlaying}
      className={`relative inline-flex items-center justify-center rounded-full p-2 text-accent-id hover:bg-white/10 active:bg-white/15 transition-colors disabled:opacity-70 ${className}`}
      aria-label={isPlaying ? 'Playing pronunciation' : 'Play pronunciation'}
    >
      {isPlaying && (
        <span className="absolute inset-0 rounded-full bg-accent-id/30 animate-ping" />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}
