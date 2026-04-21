'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ReviewCard } from '@/components/learn/ReviewCard';
import { PhraseReviewCard } from '@/components/learn/PhraseReviewCard';
import { RatingButtons } from '@/components/learn/RatingButtons';
import { ReviewComplete } from '@/components/learn/ReviewComplete';
import { MnemonicCard } from '@/components/learn/MnemonicCard';
import { Button } from '@/components/ui/Button';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { Fox } from '@/components/mascot/Fox';
import Link from 'next/link';
import { InsightCard } from '@/components/insights/InsightCard';
import { getEligibleInsight } from '@/lib/insights/engine';
import type { InsightDefinition } from '@/lib/insights/data';
import type { DueWordForReview } from '@/lib/db/queries';
import type { DuePhraseForReview } from '@/lib/db/scene-flow-queries';
import type { LearnWordFamily } from '@/components/learn/LearnClient';
import type { Word, Mnemonic, PhraseWordMnemonic } from '@/types/database';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';
type ReviewPhase = 'main' | 'transition' | 'revision' | 'done';

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
    informal_text: dw.informal_text ?? null,
    register: dw.register ?? 'neutral',
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

function HeaderPortal({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setSlot(document.getElementById('header-center-slot'));
  }, []);
  if (!slot) return null;
  return createPortal(children, slot);
}

function ProgressBarPortal({ current, total }: { current: number; total: number }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setSlot(document.getElementById('header-progress-slot'));
  }, []);
  if (!slot) return null;
  const pct = total > 0 ? (current / total) * 100 : 0;
  return createPortal(
    <div className="h-0.5 bg-card-border">
      <div
        className="h-full bg-accent-id transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>,
    slot,
  );
}

interface ReviewClientProps {
  dueWords: DueWordForReview[];
  duePhrases: DuePhraseForReview[];
  practiceWords?: DueWordForReview[];
  wordFamiliesMap?: Record<string, LearnWordFamily[]>;
  phraseWordMap?: Record<string, PhraseWordMnemonic[]>;
  insightState?: { seenIds: string[]; shownToday: number };
}

export function ReviewClient({ dueWords, duePhrases, practiceWords = [], wordFamiliesMap = {}, phraseWordMap = {}, insightState }: ReviewClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<ReviewPhase>('main');
  const [missedItems, setMissedItems] = useState<DueWordForReview[]>([]);
  const missedItemsRef = useRef<DueWordForReview[]>([]);
  const [revisionIndex, setRevisionIndex] = useState(0);
  const [revisionStep, setRevisionStep] = useState<'mnemonic' | 'quiz'>('quiz');
  const [revisionCorrectCount, setRevisionCorrectCount] = useState(0);
  const startXRef = useRef(0);
  const [practiceMode, setPracticeMode] = useState(false);

  // Insight: check for spacing_effect insight on first review visit
  const [reviewInsight] = useState<InsightDefinition | null>(() => {
    if (!insightState) return null;
    return getEligibleInsight('review_start', {
      seenInsightIds: new Set(insightState.seenIds),
      insightsShownToday: insightState.shownToday,
      totalMnemonicsViewed: 0,
      totalScenesCompleted: 0,
      totalWordsLearned: 0,
    });
  });
  const [showReviewInsight, setShowReviewInsight] = useState(!!reviewInsight);

  // Mark insight as shown on mount
  useEffect(() => {
    if (reviewInsight) {
      fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId: reviewInsight.id, action: 'shown' }),
      }).catch(() => {});
    }
  }, [reviewInsight]);

  // In practice mode, use all learned words; otherwise use SRS-due items
  const effectiveWords = practiceMode ? practiceWords : dueWords;
  const effectivePhrases = practiceMode ? [] as DuePhraseForReview[] : duePhrases;

  const items: ReviewItem[] = [];
  const wLen = effectiveWords.length;
  const pLen = effectivePhrases.length;
  let wi = 0, pi = 0;
  while (wi < wLen || pi < pLen) {
    if (wi < wLen) { items.push({ type: 'word', data: effectiveWords[wi++] }); }
    if (wi < wLen) { items.push({ type: 'word', data: effectiveWords[wi++] }); }
    if (pi < pLen) { items.push({ type: 'phrase', data: effectivePhrases[pi++] }); }
  }

  const current = items[currentIndex];

  const wordMode = 'production' as 'recognition' | 'production';
  const phraseMode = 'production' as 'recognition' | 'production';

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleRate = useCallback((rating: Rating) => {
    if (!current) return;

    if (rating === 'instant' || rating === 'got_it') {
      setCorrectCount(c => c + 1);
    }

    // Track forgot words for revision (words only, not phrases)
    if (rating === 'forgot' && current.type === 'word') {
      missedItemsRef.current = [...missedItemsRef.current, current.data];
      setMissedItems(missedItemsRef.current);
    }

    const recordFailure = () => {
      import('sonner').then(({ toast }) =>
        toast.error("Couldn't save that rating. Check your connection — we'll retry on next submit.")
      );
    };

    if (current.type === 'word') {
      fetch('/api/reviews/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: current.data.word_id,
          direction: wordMode,
          rating,
        }),
      })
        .then((res) => { if (!res.ok) recordFailure(); })
        .catch(recordFailure);
    } else {
      fetch('/api/reviews/record-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phraseId: current.data.phrase_id,
          rating,
        }),
      })
        .then((res) => { if (!res.ok) recordFailure(); })
        .catch(recordFailure);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      if (missedItemsRef.current.length > 0) {
        setPhase('transition');
      } else {
        setPhase('done');
      }
    } else {
      setCurrentIndex(nextIndex);
      setRevealed(false);
    }
  }, [currentIndex, current, items.length, wordMode]);

  const handleRevisionMnemonicContinue = useCallback(() => {
    setRevisionStep('quiz');
    setRevealed(false);
  }, []);

  const handleRevisionRate = useCallback((rating: Rating) => {
    if (rating === 'forgot') {
      // Loop back to mnemonic (or reset quiz if no mnemonic)
      if (missedItems[revisionIndex]?.mnemonic_id) {
        setRevisionStep('mnemonic');
      }
      setRevealed(false);
    } else {
      // Passed — advance
      setRevisionCorrectCount(c => c + 1);
      const nextIdx = revisionIndex + 1;
      if (nextIdx >= missedItems.length) {
        setPhase('done');
      } else {
        setRevisionIndex(nextIdx);
        setRevisionStep('quiz');
        setRevealed(false);
      }
    }
  }, [revisionIndex, missedItems]);

  // Active rate handler ref — swipe gestures read this at event time
  const activeRateHandler = useRef(handleRate);
  useEffect(() => {
    activeRateHandler.current = phase === 'revision' ? handleRevisionRate : handleRate;
  }, [phase, handleRate, handleRevisionRate]);

  // Swipe gesture handling for rating
  useEffect(() => {
    if (!revealed) return;

    function onTouchStart(e: TouchEvent) {
      startXRef.current = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      const diff = e.changedTouches[0].clientX - startXRef.current;
      if (diff > 80) {
        activeRateHandler.current('got_it');
      } else if (diff < -80) {
        activeRateHandler.current('forgot');
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [revealed]);

  // --- Empty state ---
  if (items.length === 0 && !practiceMode) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] animate-spring-in max-w-md mx-auto text-center">
        <Fox pose="proud" size="lg" aria-label="All caught up" />
        <h2 className="text-2xl font-bold text-foreground mb-1 mt-2">All caught up!</h2>
        <p className="text-text-secondary mb-6 max-w-xs">
          {practiceWords.length > 0
            ? `No reviews due right now. You can practice ${practiceWords.length} words if you'd like.`
            : 'Nothing to review yet — learn new words to grow your queue.'}
        </p>
        {practiceWords.length > 0 ? (
          <ThumbButton
            onClick={() => setPracticeMode(true)}
            size="lg"
            variant="primary"
            fullWidth={false}
          >
            Practice Now ({practiceWords.length} words)
          </ThumbButton>
        ) : (
          <Link href="/paths" className="block w-full">
            <ThumbButton size="lg" variant="primary">
              Go to Learning Paths
            </ThumbButton>
          </Link>
        )}
      </div>
    );
  }

  // --- Done ---
  if (phase === 'done') {
    return (
      <ReviewComplete
        totalReviewed={items.length}
        correctCount={correctCount}
        revisionCount={missedItems.length}
        revisionCorrectCount={revisionCorrectCount}
      />
    );
  }

  // --- Transition interstitial ---
  if (phase === 'transition') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] animate-spring-in max-w-md mx-auto text-center">
        <Fox pose="thinking" size="lg" aria-label="Revision round" />
        <h2 className="text-2xl font-bold text-foreground mb-2 mt-2">Revision Round</h2>
        <p className="text-text-secondary mb-2">
          You forgot {missedItems.length} word{missedItems.length !== 1 ? 's' : ''} during review.
        </p>
        <p className="text-text-secondary mb-8">
          Let&apos;s go through them again with the mnemonics until you get each one right.
        </p>
        <ThumbButton
          onClick={() => {
            setPhase('revision');
            setRevisionIndex(0);
            setRevisionStep('quiz');
            setRevealed(false);
          }}
          size="lg"
          variant="primary"
        >
          Start Revision Round
        </ThumbButton>
      </div>
    );
  }

  // --- Revision phase ---
  if (phase === 'revision') {
    const revisionItem = missedItems[revisionIndex];
    if (!revisionItem) {
      setPhase('done');
      return null;
    }

    const stepLabel = revisionStep === 'quiz' ? 'Recall' : 'Review';

    return (
      <>
        <HeaderPortal>
          <span className="text-sm text-text-secondary truncate">
            Revision &middot; {revisionIndex + 1}/{missedItems.length} &middot; {stepLabel}
          </span>
        </HeaderPortal>
        <ProgressBarPortal current={revisionIndex + 1} total={missedItems.length} />

        {revisionStep === 'mnemonic' ? (
          <MnemonicCard
            key={`mnemonic-${revisionItem.word_id}`}
            wordText={revisionItem.text}
            keyword={revisionItem.keyword_text ?? ''}
            sceneDescription={revisionItem.scene_description ?? ''}
            bridgeSentence={revisionItem.bridge_sentence}
            imageUrl={revisionItem.image_url}
            wordId={revisionItem.word_id}
            meaningEn={revisionItem.meaning_en}
            onContinue={handleRevisionMnemonicContinue}
          />
        ) : (
          <ReviewCard
            key={`revision-${revisionItem.word_id}`}
            word={toWord(revisionItem)}
            mnemonic={toMnemonic(revisionItem)}
            mode="production"
            onReveal={handleReveal}
            revealed={revealed}
            onRate={handleRevisionRate}
            wordFamilies={wordFamiliesMap[revisionItem.word_id]}
          />
        )}
      </>
    );
  }

  // --- Main review phase ---
  if (!current) {
    return <ReviewComplete totalReviewed={0} correctCount={0} />;
  }

  const typeLabel = current.type === 'phrase' ? 'Phrase' : 'Word';
  const activeMode = current.type === 'word' ? wordMode : phraseMode;
  const modeLabel = activeMode === 'recognition' ? 'Recognize' : 'Produce';

  return (
    <>
      <HeaderPortal>
        <span className="text-sm text-text-secondary truncate">
          {practiceMode ? 'Practice' : 'Review'} &middot; {currentIndex + 1}/{items.length} &middot; {modeLabel}
        </span>
      </HeaderPortal>
      <ProgressBarPortal current={currentIndex + 1} total={items.length} />

      {showReviewInsight && reviewInsight && (
        <div className="mb-4">
          <InsightCard insight={reviewInsight} onDismiss={() => setShowReviewInsight(false)} />
        </div>
      )}

      {current.type === 'word' ? (
        <ReviewCard
          key={current.data.word_id}
          word={toWord(current.data)}
          mnemonic={toMnemonic(current.data)}
          mode={wordMode}
          onReveal={handleReveal}
          revealed={revealed}
          onRate={handleRate}
          wordFamilies={wordFamiliesMap[current.data.word_id]}
        />
      ) : (
        <>
          <PhraseReviewCard
            key={current.data.phrase_id}
            textTarget={current.data.text_target}
            textEn={current.data.text_en}
            literalTranslation={current.data.literal_translation}
            phraseBridgeSentence={current.data.phrase_bridge_sentence}
            compositeImageUrl={current.data.composite_image_url}
            words={phraseWordMap[current.data.phrase_id] ?? []}
            mode={phraseMode}
            onReveal={handleReveal}
            revealed={revealed}
          />
          {revealed && (
            <div className="mt-4">
              <RatingButtons onRate={handleRate} />
            </div>
          )}
        </>
      )}
    </>
  );
}
