'use client';

import { useState, useCallback, useRef, useEffect, useInsertionEffect } from 'react';
import { playWordPronunciation, stopPlayback } from '@/lib/audio';

interface PronunciationButtonProps {
  wordId: string;
  audioUrl?: string | null;
  text?: string;
  languageCode?: string;
  size?: number;
  className?: string;
}

/* ---- style injection (runs once, before paint) ---- */
const ARC_CSS = `
@keyframes sw-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}
.sw-arc-1 { animation: sw-pulse 1s ease-in-out infinite; }
.sw-arc-2 { animation: sw-pulse 1s ease-in-out infinite; animation-delay: 0.3s; }
`;
let _injected = false;
function ensureArcStyles() {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;
  const el = document.createElement('style');
  el.setAttribute('data-sw', '1');
  el.textContent = ARC_CSS;
  document.head.appendChild(el);
}

export function PronunciationButton({
  wordId,
  audioUrl,
  text,
  languageCode,
  size = 24,
  className = '',
}: PronunciationButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const arcInner = useRef<SVGPathElement>(null);
  const arcOuter = useRef<SVGPathElement>(null);

  // Inject keyframe styles into <head> once, before first paint
  useInsertionEffect(() => {
    ensureArcStyles();
  }, []);

  // Toggle arc animation classes based on playback state
  useEffect(() => {
    const inner = arcInner.current;
    const outer = arcOuter.current;
    if (isPlaying) {
      inner?.classList.add('sw-arc-1');
      outer?.classList.add('sw-arc-2');
    } else {
      inner?.classList.remove('sw-arc-1');
      outer?.classList.remove('sw-arc-2');
    }
  }, [isPlaying]);

  const handleClick = useCallback(async () => {
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    try {
      await playWordPronunciation(wordId, {
        audioUrl,
        text,
        languageCode: languageCode as import('@/types/audio').SupportedLanguageCode | undefined,
      });
    } catch {
      // ignore playback errors
    } finally {
      setIsPlaying(false);
    }
  }, [wordId, audioUrl, text, languageCode, isPlaying]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center rounded-full p-2 text-accent-id hover:bg-white/10 active:bg-white/15 transition-colors ${className}`}
      aria-label={isPlaying ? 'Playing pronunciation' : 'Play pronunciation'}
    >
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
        <path ref={arcInner} d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path ref={arcOuter} d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}
