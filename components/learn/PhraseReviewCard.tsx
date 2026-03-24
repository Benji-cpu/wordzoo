'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';

interface PhraseReviewCardProps {
  textTarget: string;
  textEn: string;
  literalTranslation: string | null;
  mode: 'recognition' | 'production';
  onReveal: () => void;
  revealed: boolean;
}

export function PhraseReviewCard({
  textTarget,
  textEn,
  literalTranslation,
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
                  <p className="text-sm text-text-secondary italic">
                    Literally: &ldquo;{literalTranslation}&rdquo;
                  </p>
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

            {revealed && (
              <div className="mt-6 pt-6 border-t border-card-border animate-slide-up">
                <p className="text-2xl font-bold text-accent-id mb-2">{textTarget}</p>
                {literalTranslation && (
                  <p className="text-sm text-text-secondary italic">
                    Literally: &ldquo;{literalTranslation}&rdquo;
                  </p>
                )}
              </div>
            )}

            {!revealed && (
              <p className="text-sm text-text-secondary mt-8">Tap to reveal</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
