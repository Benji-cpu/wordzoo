'use client';

import { useState, useRef, useEffect } from 'react';
import type { LearnWord } from '@/components/learn/LearnClient';
import { PronunciationButton } from '@/components/audio/SpeakerButton';

interface TappableWordProps {
  word: LearnWord;
  children: string;
}

export function TappableWord({ word, children }: TappableWordProps) {
  const [showPopover, setShowPopover] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopover((prev) => !prev);
  };

  // Close on click outside
  useEffect(() => {
    if (!showPopover) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [showPopover]);

  return (
    <span ref={wrapperRef} className="relative inline">
      <span
        onClick={handleClick}
        className="border-b border-dotted border-accent-id/50 cursor-pointer"
      >
        {children}
      </span>

      {showPopover && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 glass-card p-3 rounded-xl shadow-lg min-w-[160px] text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {word.mnemonic?.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={word.mnemonic.image_url}
              alt={word.mnemonic.keyword_text}
              className="w-20 h-20 rounded-lg object-cover mx-auto mb-2"
            />
          )}
          {word.mnemonic?.keyword_text && (
            <p className="text-xs text-text-secondary">
              sounds like &ldquo;{word.mnemonic.keyword_text}&rdquo;
            </p>
          )}
          <div className="flex items-center justify-center gap-0.5">
            <p className="text-sm font-medium text-foreground">{word.word.meaning_en}</p>
            <PronunciationButton
              wordId={word.word.id}
              audioUrl={word.word.pronunciation_audio_url}
              text={word.word.text}
              size={14}
              className="-my-1 p-1"
            />
          </div>
        </span>
      )}
    </span>
  );
}
