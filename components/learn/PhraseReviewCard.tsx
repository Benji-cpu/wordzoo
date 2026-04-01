'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';

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
  mode,
  onReveal,
  revealed,
}: PhraseReviewCardProps) {
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
          <>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Phrase</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">
              What does this mean?
            </p>
            <h2 className="text-2xl font-bold text-accent-id mb-2">{textTarget}</h2>

            {revealed && (
              <div className="mt-6 pt-6 border-t border-card-border animate-slide-up">
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
                {compositeImageUrl && (
                  <div className="relative w-full rounded-xl overflow-hidden mb-3 bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={compositeImageUrl} alt="" className="w-full max-h-[45dvh] object-cover rounded-xl" />
                  </div>
                )}
              </div>
            )}

            {!revealed && (
              <p className="text-sm text-text-secondary mt-8">Tap to reveal</p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Phrase</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">
              How do you say...
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-2">{textEn}</h2>
            {compositeImageUrl && (
              <div className="relative w-full rounded-xl overflow-hidden mb-3 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={compositeImageUrl} alt="" className="w-full max-h-[45dvh] object-cover rounded-xl" />
              </div>
            )}

            {revealed && (
              <div className="mt-4 pt-4 border-t border-card-border animate-slide-up">
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
