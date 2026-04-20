'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { SwipeIndicators, getSwipeBorderStyle } from '@/components/learn/SwipeIndicators';
import type { PhraseWordMnemonic } from '@/types/database';

function renderBridgeSentence(sentence: string) {
  const parts = sentence.split(/\b([A-Z]{2,}(?:\s+[A-Z]{2,})*)\b/);
  return parts.map((part, i) =>
    /^[A-Z]{2,}(?:\s+[A-Z]{2,})*$/.test(part) ? (
      <span key={i} className="font-bold text-accent-id not-italic">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface PhraseReviewCardProps {
  textTarget: string;
  textEn: string;
  literalTranslation: string | null;
  phraseBridgeSentence: string | null;
  compositeImageUrl: string | null;
  words?: PhraseWordMnemonic[];
  mode: 'recognition' | 'production';
  onReveal: () => void;
  revealed: boolean;
}

export function PhraseReviewCard({
  textTarget,
  textEn,
  literalTranslation,
  phraseBridgeSentence,
  compositeImageUrl,
  words = [],
  mode,
  onReveal,
  revealed,
}: PhraseReviewCardProps) {
  // Auto-expand word breakdown if no composite image and no bridge sentence
  const autoExpand = !compositeImageUrl && !phraseBridgeSentence;
  const [showWordBreakdown, setShowWordBreakdown] = useState(autoExpand);
  const [swipeX, setSwipeX] = useState(0);
  const startXRef = useRef(0);

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

  const wordBreakdown = words.length > 0 && revealed ? (
    <div className="mt-3">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowWordBreakdown(prev => !prev);
        }}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground transition-colors mx-auto"
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${showWordBreakdown ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        {showWordBreakdown ? 'Hide' : 'See'} word mnemonics
      </button>
      {showWordBreakdown && (
        <div className="mt-3 space-y-2.5 animate-slide-up">
          {words.map((w) => (
            <div key={w.word_id} className="flex items-start gap-3 text-left">
              {w.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.image_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-card-border/30 flex-shrink-0 mt-0.5 flex items-center justify-center text-xs text-text-secondary">
                  {w.word_text.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {w.word_text} <span className="text-text-secondary font-normal">= {w.word_en}</span>
                </p>
                {w.keyword_text && (
                  <p className="text-xs text-text-secondary">
                    sounds like &ldquo;<span className="text-accent-id font-medium">{w.keyword_text}</span>&rdquo;
                  </p>
                )}
                {w.bridge_sentence && (
                  <p className="text-xs text-text-secondary italic mt-0.5">
                    {renderBridgeSentence(w.bridge_sentence)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;

  const swipeStyle = swipeX !== 0 ? {
    transform: `translateX(${swipeX * 0.3}px) rotate(${swipeX * 0.02}deg)`,
    transition: 'none',
  } : {};

  return (
    <div style={swipeStyle} className="relative">
      {revealed && <SwipeIndicators swipeX={swipeX} />}
      <Card
        className={`text-center py-2 sm:py-4 transition-all duration-300 ${revealed ? 'animate-fade-in' : ''}`}
        style={revealed ? getSwipeBorderStyle(swipeX) : {}}
        onClick={!revealed ? onReveal : undefined}
      >
        {mode === 'recognition' ? (
          <>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Phrase</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">
              What does this mean?
            </p>
            <h2 className="text-2xl font-bold text-accent-id mb-2">{textTarget}</h2>

            {revealed && (
              <div className="mt-3 pt-3 border-t border-card-border animate-slide-up">
                <p className="text-xl text-foreground font-medium mb-2">{textEn}</p>
                {literalTranslation && (
                  <p className="text-sm text-text-secondary italic mb-3">
                    Literally: &ldquo;{literalTranslation}&rdquo;
                  </p>
                )}
                {phraseBridgeSentence && (
                  <p className="text-base text-foreground italic mb-3">
                    {renderBridgeSentence(phraseBridgeSentence)}
                  </p>
                )}
                {compositeImageUrl ? (
                  <div className="relative w-full rounded-xl overflow-hidden mb-3 bg-surface-inset">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={compositeImageUrl} alt={`Illustration for phrase: ${textEn}`} className="w-full max-h-[45dvh] object-cover rounded-xl" />
                  </div>
                ) : !phraseBridgeSentence ? (
                  <div className="rounded-xl bg-gradient-to-br from-accent-id/15 to-surface-inset py-6 px-4 mb-3">
                    <p className="text-xs text-text-secondary">Visual coming soon</p>
                  </div>
                ) : null}
                {wordBreakdown}
              </div>
            )}

            {!revealed && (
              <p className="text-sm text-text-secondary mt-4">Tap to reveal</p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Phrase</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">
              How do you say...
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-2">{textEn}</h2>
            {compositeImageUrl ? (
              <div className="relative w-full rounded-xl overflow-hidden mb-3 bg-surface-inset">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={compositeImageUrl} alt={`Illustration for phrase: ${textEn}`} className="w-full max-h-[45dvh] object-cover rounded-xl" />
              </div>
            ) : (
              <div className="rounded-xl bg-gradient-to-br from-accent-id/15 to-surface-inset py-6 px-4 mb-3">
                <p className="text-xs text-text-secondary">Visual coming soon</p>
              </div>
            )}

            {revealed && (
              <div className="mt-3 pt-3 border-t border-card-border animate-slide-up">
                <p className="text-2xl font-bold text-accent-id mb-2">{textTarget}</p>
                {literalTranslation && (
                  <p className="text-sm text-text-secondary italic mb-3">
                    Literally: &ldquo;{literalTranslation}&rdquo;
                  </p>
                )}
                {phraseBridgeSentence && (
                  <p className="text-base text-foreground italic mb-3">
                    {renderBridgeSentence(phraseBridgeSentence)}
                  </p>
                )}
                {wordBreakdown}
              </div>
            )}

            {!revealed && (
              <p className="text-sm text-text-secondary mt-3">Tap to reveal</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
