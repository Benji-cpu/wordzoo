'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getMockDueWords } from '@/lib/mocks/learning-data';
import { ReviewCard } from '@/components/learn/ReviewCard';
import { RatingButtons } from '@/components/learn/RatingButtons';
import { ReviewComplete } from '@/components/learn/ReviewComplete';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';

export default function ReviewPage() {
  const [dueWords] = useState(() => getMockDueWords());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const startXRef = useRef(0);

  const currentWord = dueWords[currentIndex];

  // Determine mode: production only after 3+ reviews
  const mode: 'recognition' | 'production' =
    currentWord && currentWord.times_reviewed >= 3 ? 'production' : 'recognition';

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleRate = useCallback((rating: Rating) => {
    if (rating === 'instant' || rating === 'got_it') {
      setCorrectCount(c => c + 1);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= dueWords.length) {
      setDone(true);
    } else {
      setCurrentIndex(nextIndex);
      setRevealed(false);
    }
  }, [currentIndex, dueWords.length]);

  // Swipe gesture handling for rating
  useEffect(() => {
    if (!revealed) return;

    function onTouchStart(e: TouchEvent) {
      startXRef.current = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      const diff = e.changedTouches[0].clientX - startXRef.current;
      if (diff > 80) {
        handleRate('got_it'); // Right swipe
      } else if (diff < -80) {
        handleRate('forgot'); // Left swipe
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [revealed, handleRate]);

  if (done) {
    return (
      <div className="max-w-lg mx-auto pb-24">
        <ReviewComplete totalReviewed={dueWords.length} correctCount={correctCount} />
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="max-w-lg mx-auto pb-24">
        <ReviewComplete totalReviewed={0} correctCount={0} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Review</h1>
        <span className="text-sm text-text-secondary">
          {mode === 'recognition' ? 'Recognize' : 'Produce'}
        </span>
      </div>

      <ReviewCard
        key={currentWord.word_id}
        word={currentWord.word}
        mnemonic={currentWord.mnemonic}
        mode={mode}
        onReveal={handleReveal}
        revealed={revealed}
      />

      {revealed && (
        <div className="mt-4">
          <RatingButtons onRate={handleRate} />
          <p className="text-center text-xs text-text-secondary mt-3">
            Or swipe: right = got it, left = forgot
          </p>
        </div>
      )}
    </div>
  );
}
