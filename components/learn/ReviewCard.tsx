'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { FeedbackButtons } from '@/components/learn/FeedbackButtons';
import { RatingButtons } from '@/components/learn/RatingButtons';
import { PronunciationButton } from '@/components/audio/SpeakerButton';
import { playWordPronunciation, isAudioUnlocked } from '@/lib/audio/pronunciation';
import { SwipeIndicators, getSwipeBorderStyle } from '@/components/learn/SwipeIndicators';
import { CollapsibleWordFamily } from '@/components/learn/WordFamilyCard';
import type { LearnWordFamily } from '@/components/learn/LearnClient';
import type { Word, Mnemonic } from '@/types/database';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';

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

function ImageSkeleton() {
  return <div className="w-full h-[200px] bg-surface-inset animate-pulse rounded-xl" />;
}

interface ReviewCardProps {
  word: Word;
  mnemonic: Mnemonic;
  mode: 'recognition' | 'production';
  onReveal: () => void;
  revealed: boolean;
  onRate?: (rating: Rating) => void;
  wordFamilies?: LearnWordFamily[];
}

export function ReviewCard({ word, mnemonic, mode, onReveal, revealed, onRate, wordFamilies }: ReviewCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const startXRef = useRef(0);

  // Reset image loaded state when word changes
  useEffect(() => {
    setImageLoaded(false);
  }, [word.id]);

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

  // Auto-play pronunciation when card appears in recognition mode
  useEffect(() => {
    if (mode === 'recognition' && isAudioUnlocked()) {
      playWordPronunciation(word.id, {
        audioUrl: word.pronunciation_audio_url,
        text: word.text,
      }).catch(() => {});
    }
  }, [word.id, mode]);

  // Auto-play pronunciation when answer is revealed
  useEffect(() => {
    if (revealed && isAudioUnlocked()) {
      playWordPronunciation(word.id, {
        audioUrl: word.pronunciation_audio_url,
        text: word.text,
      }).catch(() => {});
    }
  }, [revealed, word.id]);

  const swipeStyle = swipeX !== 0 ? {
    transform: `translateX(${swipeX * 0.3}px) rotate(${swipeX * 0.02}deg)`,
    transition: 'none',
  } : {};

  const mnemonicImage = mnemonic.image_url && (
    <div className="relative w-full rounded-xl overflow-hidden mb-1 bg-surface-inset">
      {!imageLoaded && <ImageSkeleton />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mnemonic.image_url}
        alt=""
        className={`w-full max-h-[calc(100dvh-340px)] min-h-[120px] object-cover rounded-xl transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0 h-0'
        }`}
        onLoad={() => setImageLoaded(true)}
      />
      {imageLoaded && (
        <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
          <FeedbackButtons mnemonicId={mnemonic.id} context="review" compact overlay />
        </div>
      )}
    </div>
  );

  const ratingSection = onRate && (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      <RatingButtons onRate={onRate} />
    </div>
  );

  const wordFamilySection = revealed && wordFamilies && wordFamilies.length > 0 && (
    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
      <CollapsibleWordFamily
        rootWord={{ text: word.text, meaning: word.meaning_en }}
        derivedForms={wordFamilies}
      />
    </div>
  );

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
            {/* Question area — collapses on reveal */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                revealed ? 'max-h-0 opacity-0' : 'max-h-[300px] opacity-100'
              }`}
            >
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">
                What does this mean?
              </p>
              <h2 className="text-3xl font-bold text-accent-id mb-2">{word.text}</h2>
              {word.romanization && (
                <p className="text-lg text-text-secondary">{word.romanization}</p>
              )}
              <div onClick={(e) => e.stopPropagation()}>
                <PronunciationButton wordId={word.id} audioUrl={word.pronunciation_audio_url} text={word.text} />
              </div>
              <p className="text-sm text-text-secondary mt-4">Tap to reveal</p>
            </div>

            {/* Compact header bar — appears on reveal */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                revealed ? 'max-h-[60px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="text-lg font-bold text-accent-id">{word.text}</span>
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <PronunciationButton wordId={word.id} audioUrl={word.pronunciation_audio_url} text={word.text} size={18} />
                </div>
                <span className="text-text-secondary">=</span>
                <span className="text-lg text-foreground font-medium">{word.meaning_en}</span>
              </div>
            </div>

            {/* Mnemonic content — fades in on reveal */}
            {revealed && (
              <div className="pt-2 border-t border-card-border animate-slide-up">
                {mnemonic.keyword_text && (
                  <p className="text-sm sm:text-base text-foreground text-center mb-1 whitespace-nowrap overflow-hidden text-ellipsis px-1">
                    <span className="font-bold text-accent-id">{word.text}</span>
                    {' '}sounds like{' '}
                    <span className="font-bold">&ldquo;{mnemonic.keyword_text}&rdquo;</span>
                  </p>
                )}
                {mnemonic.bridge_sentence && (
                  <p className="text-sm sm:text-base text-foreground italic mb-2 whitespace-nowrap overflow-hidden text-ellipsis px-1">
                    {renderBridgeSentence(mnemonic.bridge_sentence)}
                  </p>
                )}
                {word.informal_text && (
                  <p className="text-sm text-text-secondary mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-id/10 text-accent-id text-xs font-medium">
                      Casual: {word.informal_text}
                    </span>
                  </p>
                )}
                {mnemonicImage}
                {ratingSection}
                {wordFamilySection}
              </div>
            )}
          </>
        ) : (
          // Production: show meaning → reveal foreign word + mnemonic image
          <>
            {/* Question label — collapses on reveal */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                revealed ? 'max-h-0 opacity-0' : 'max-h-[80px] opacity-100'
              }`}
            >
              <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">
                How do you say...
              </p>
              <h2 className="text-2xl font-bold text-foreground mb-3">{word.meaning_en}</h2>
            </div>

            {/* Compact header — appears on reveal */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                revealed ? 'max-h-[40px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="text-sm text-text-secondary mb-2">
                &ldquo;{word.meaning_en}&rdquo;
              </p>
            </div>

            {/* Answer content — fades in on reveal */}
            {revealed && (
              <div className="pt-2 border-t border-card-border animate-slide-up">
                {mnemonicImage}
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="text-2xl font-bold text-accent-id">{word.text}</p>
                  <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                    <PronunciationButton wordId={word.id} audioUrl={word.pronunciation_audio_url} text={word.text} size={20} />
                  </div>
                </div>
                {word.romanization && (
                  <p className="text-base text-text-secondary mb-1">{word.romanization}</p>
                )}
                {mnemonic.keyword_text && (
                  <p className="text-sm sm:text-base text-foreground text-center mt-1 whitespace-nowrap overflow-hidden text-ellipsis px-1">
                    sounds like <span className="font-bold">&ldquo;{mnemonic.keyword_text}&rdquo;</span>
                  </p>
                )}
                {mnemonic.bridge_sentence && (
                  <p className="text-sm sm:text-base text-foreground italic mt-1 whitespace-nowrap overflow-hidden text-ellipsis px-1">
                    {renderBridgeSentence(mnemonic.bridge_sentence)}
                  </p>
                )}
                {word.informal_text && (
                  <p className="text-sm text-text-secondary mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-id/10 text-accent-id text-xs font-medium">
                      Casual: {word.informal_text}
                    </span>
                  </p>
                )}
                {ratingSection}
                {wordFamilySection}
              </div>
            )}

            {!revealed && (
              <p className="text-sm text-text-secondary mt-4">Tap to reveal</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
