'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import type { Word, Mnemonic } from '@/types/database';

interface ReviewCardProps {
  word: Word;
  mnemonic: Mnemonic;
  mode: 'recognition' | 'production';
  onReveal: () => void;
  revealed: boolean;
}

export function ReviewCard({ word, mnemonic, mode, onReveal, revealed }: ReviewCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const startXRef = useRef(0);

  // Swipe handling
  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      startXRef.current = e.touches[0].clientX;
      setSwipeX(0);
    }
    function onTouchMove(e: TouchEvent) {
      if (!revealed) return;
      setSwipeX(e.touches[0].clientX - startXRef.current);
    }
    function onTouchEnd() {
      setSwipeX(0);
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [revealed]);

  const swipeStyle = swipeX !== 0 ? {
    transform: `translateX(${swipeX * 0.3}px) rotate(${swipeX * 0.02}deg)`,
    transition: 'none',
  } : {};

  return (
    <div style={swipeStyle}>
      <Card
        className={`text-center py-10 transition-all duration-300 ${revealed ? 'animate-fade-in' : ''}`}
        onClick={!revealed ? onReveal : undefined}
      >
        {mode === 'recognition' ? (
          // Recognition: show foreign word → reveal meaning
          <>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">
              What does this mean?
            </p>
            <h2 className="text-3xl font-bold text-accent-id mb-2">{word.text}</h2>
            {word.romanization && (
              <p className="text-lg text-text-secondary">{word.romanization}</p>
            )}

            {revealed && (
              <div className="mt-6 pt-6 border-t border-card-border animate-slide-up">
                <p className="text-xl text-foreground font-medium mb-3">{word.meaning_en}</p>
                {mnemonic.image_url && (
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mnemonic.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm text-text-secondary">
                  &ldquo;{mnemonic.keyword_text}&rdquo; — {mnemonic.scene_description}
                </p>
              </div>
            )}

            {!revealed && (
              <p className="text-sm text-text-secondary mt-8">Tap to reveal</p>
            )}
          </>
        ) : (
          // Production: show meaning + image → reveal foreign word
          <>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">
              How do you say...
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-3">{word.meaning_en}</h2>
            {mnemonic.image_url && (
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mnemonic.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            {revealed && (
              <div className="mt-4 pt-4 border-t border-card-border animate-slide-up">
                <p className="text-3xl font-bold text-accent-id mb-1">{word.text}</p>
                {word.romanization && (
                  <p className="text-lg text-text-secondary">{word.romanization}</p>
                )}
                <p className="text-sm text-text-secondary mt-2">
                  &ldquo;{mnemonic.keyword_text}&rdquo;
                </p>
              </div>
            )}

            {!revealed && (
              <p className="text-sm text-text-secondary mt-6">Tap to reveal</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
