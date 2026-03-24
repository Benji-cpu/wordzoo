'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ReviewCard } from '@/components/learn/ReviewCard';
import { PhraseReviewCard } from '@/components/learn/PhraseReviewCard';
import { RatingButtons } from '@/components/learn/RatingButtons';
import { ReviewComplete } from '@/components/learn/ReviewComplete';
import Link from 'next/link';
import type { DueWordForReview } from '@/lib/db/queries';
import type { DuePhraseForReview } from '@/lib/db/scene-flow-queries';
import type { Word, Mnemonic } from '@/types/database';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';

type ReviewItem =
  | { type: 'word'; data: DueWordForReview }
  | { type: 'phrase'; data: DuePhraseForReview };

function toWord(dw: DueWordForReview): Word {
  return {
    id: dw.word_id,
    language_id: dw.language_id,
    text: dw.text,
    romanization: dw.romanization,
    pronunciation_audio_url: dw.pronunciation_audio_url,
    meaning_en: dw.meaning_en,
    part_of_speech: dw.part_of_speech,
    frequency_rank: dw.frequency_rank,
    created_at: new Date(),
  };
}

function toMnemonic(dw: DueWordForReview): Mnemonic {
  return {
    id: dw.mnemonic_id ?? '',
    word_id: dw.word_id,
    user_id: null,
    keyword_text: dw.keyword_text ?? '',
    scene_description: dw.scene_description ?? '',
    bridge_sentence: dw.bridge_sentence ?? null,
    image_url: dw.image_url,
    audio_url: null,
    is_custom: false,
    upvote_count: 0,
    thumbs_up_count: 0,
    thumbs_down_count: 0,
    image_reviewed: false,
    created_at: new Date(),
  };
}

interface ReviewClientProps {
  dueWords: DueWordForReview[];
  duePhrases: DuePhraseForReview[];
}

export function ReviewClient({ dueWords, duePhrases }: ReviewClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const startXRef = useRef(0);

  // Interleave words and phrases
  const items: ReviewItem[] = [];
  const wLen = dueWords.length;
  const pLen = duePhrases.length;
  let wi = 0, pi = 0;
  while (wi < wLen || pi < pLen) {
    // Alternate: 2 words, 1 phrase (roughly)
    if (wi < wLen) { items.push({ type: 'word', data: dueWords[wi++] }); }
    if (wi < wLen) { items.push({ type: 'word', data: dueWords[wi++] }); }
    if (pi < pLen) { items.push({ type: 'phrase', data: duePhrases[pi++] }); }
  }

  const current = items[currentIndex];

  const wordMode: 'recognition' | 'production' =
    current?.type === 'word' && current.data.times_reviewed >= 3 ? 'production' : 'recognition';

  const phraseMode: 'recognition' | 'production' =
    current?.type === 'phrase' && current.data.times_reviewed >= 3 ? 'production' : 'recognition';

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleRate = useCallback((rating: Rating) => {
    if (!current) return;

    if (rating === 'instant' || rating === 'got_it') {
      setCorrectCount(c => c + 1);
    }

    if (current.type === 'word') {
      fetch('/api/reviews/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: current.data.word_id,
          direction: wordMode,
          rating,
        }),
      }).catch(() => {});
    } else {
      fetch('/api/reviews/record-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phraseId: current.data.phrase_id,
          rating,
        }),
      }).catch(() => {});
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      setDone(true);
    } else {
      setCurrentIndex(nextIndex);
      setRevealed(false);
    }
  }, [currentIndex, current, items.length, wordMode]);

  // Swipe gesture handling for rating
  useEffect(() => {
    if (!revealed) return;

    function onTouchStart(e: TouchEvent) {
      startXRef.current = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      const diff = e.changedTouches[0].clientX - startXRef.current;
      if (diff > 80) {
        handleRate('got_it');
      } else if (diff < -80) {
        handleRate('forgot');
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [revealed, handleRate]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
        <p className="text-4xl mb-4">✅</p>
        <h2 className="text-xl font-bold text-foreground mb-1">No items due for review</h2>
        <p className="text-text-secondary mb-6">Keep learning to build your review queue!</p>
        <Link
          href="/paths"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-accent-id text-white font-medium hover:bg-accent-id/90 transition-colors"
        >
          Go to Learning Paths
        </Link>
      </div>
    );
  }

  if (done) {
    return <ReviewComplete totalReviewed={items.length} correctCount={correctCount} />;
  }

  if (!current) {
    return <ReviewComplete totalReviewed={0} correctCount={0} />;
  }

  const typeLabel = current.type === 'phrase' ? 'Phrase' : 'Word';
  const modeLabel = current.type === 'word'
    ? (wordMode === 'recognition' ? 'Recognize' : 'Produce')
    : (phraseMode === 'recognition' ? 'Recognize' : 'Produce');

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Review</h1>
        <span className="text-sm text-text-secondary">
          {currentIndex + 1}/{items.length} &middot; {typeLabel} &middot; {modeLabel}
        </span>
      </div>

      {current.type === 'word' ? (
        <ReviewCard
          key={current.data.word_id}
          word={toWord(current.data)}
          mnemonic={toMnemonic(current.data)}
          mode={wordMode}
          onReveal={handleReveal}
          revealed={revealed}
        />
      ) : (
        <PhraseReviewCard
          key={current.data.phrase_id}
          textTarget={current.data.text_target}
          textEn={current.data.text_en}
          literalTranslation={current.data.literal_translation}
          mode={phraseMode}
          onReveal={handleReveal}
          revealed={revealed}
        />
      )}

      {revealed && (
        <div className="mt-4">
          <RatingButtons onRate={handleRate} />
          <p className="text-center text-xs text-text-secondary mt-3">
            Or swipe: right = got it, left = forgot
          </p>
        </div>
      )}
    </>
  );
}
