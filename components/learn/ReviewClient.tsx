'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ReviewCard } from '@/components/learn/ReviewCard';
import { PhraseReviewCard } from '@/components/learn/PhraseReviewCard';
import { RatingButtons } from '@/components/learn/RatingButtons';
import { ReviewComplete } from '@/components/learn/ReviewComplete';
import { MnemonicCard } from '@/components/learn/MnemonicCard';
import { preloadAudioUrls } from '@/lib/audio';
import { Button } from '@/components/ui/Button';
import { ThumbButton } from '@/components/ui/ThumbButton';
import { Fox } from '@/components/mascot/Fox';
import Link from 'next/link';
import { InsightCard } from '@/components/insights/InsightCard';
import { getEligibleInsight } from '@/lib/insights/engine';
import { toastError } from '@/lib/ui/toast';
import type { InsightDefinition } from '@/lib/insights/data';
import { CanDoTest, type CertifyResult } from '@/components/learn/CanDoTest';
import type { DueWordForReview } from '@/lib/db/queries';
import type { DuePhraseForReview } from '@/lib/db/scene-flow-queries';
import type { DueCanDo } from '@/lib/db/can-do-queries';
import type { LearnWordFamily } from '@/types/learn';
import type { Word, Mnemonic, PhraseWordMnemonic } from '@/types/database';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';
type ReviewPhase = 'main' | 'transition' | 'revision' | 'done';

type ReviewItem =
  | { type: 'word'; data: DueWordForReview }
  | { type: 'phrase'; data: DuePhraseForReview }
  | { type: 'can_do'; data: DueCanDo };

/** At most this many certification tests per review session. */
const MAX_CAN_DOS_PER_SESSION = 2;

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
  dueCanDos?: DueCanDo[];
  practiceWords?: DueWordForReview[];
  wordFamiliesMap?: Record<string, LearnWordFamily[]>;
  phraseWordMap?: Record<string, PhraseWordMnemonic[]>;
  languageCode?: string | null;
  /**
   * Total items due in this language, UNCAPPED. The queue itself is capped at
   * 20 words + 20 phrases so a sitting stays short, so this is usually larger
   * than `items.length` — and without it the session would end on
   * "All caught up!" with a hundred items still waiting.
   */
  dueTotal?: number;
  /** Due counts in languages other than the active one — never say "all caught up" while these exist. */
  otherLanguagesDue?: { code: string; name: string; count: number }[];
  insightState?: { seenIds: string[]; shownToday: number };
}

export function ReviewClient({ dueWords, duePhrases, dueCanDos = [], practiceWords = [], wordFamiliesMap = {}, phraseWordMap = {}, languageCode = null, dueTotal, otherLanguagesDue = [], insightState }: ReviewClientProps) {
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

  // Can-dos go FIRST, and are capped. First because they're the highest-value
  // item in the queue — someone who bails after three cards should still have
  // done the thing that actually measures capability. Capped because a wall of
  // unaided production is demoralising, and each one costs a Gemini call.
  const items: ReviewItem[] = practiceMode
    ? []
    : dueCanDos.slice(0, MAX_CAN_DOS_PER_SESSION).map((d) => ({ type: 'can_do' as const, data: d }));

  const wLen = effectiveWords.length;
  const pLen = effectivePhrases.length;
  let wi = 0, pi = 0;
  while (wi < wLen || pi < pLen) {
    if (wi < wLen) { items.push({ type: 'word', data: effectiveWords[wi++] }); }
    if (wi < wLen) { items.push({ type: 'word', data: effectiveWords[wi++] }); }
    if (pi < pLen) { items.push({ type: 'phrase', data: effectivePhrases[pi++] }); }
  }

  // Items still due that this sitting won't reach. Compared against words +
  // phrases only: `items` also carries can-dos, which aren't part of the SRS
  // due count. Practice mode has no queue to run down, so nothing is "left".
  const dueRemaining = practiceMode
    ? 0
    : Math.max(0, (dueTotal ?? wLen + pLen) - (wLen + pLen));

  const current = items[currentIndex];

  // Preload audio for the next 3 items so playback is instant on reveal.
  // Browser HTTP cache is the only cache we rely on — pronunciation.ts will
  // hit it transparently when it constructs the actual playing <audio>.
  useEffect(() => {
    const next = items.slice(currentIndex, currentIndex + 4);
    const urls: Array<string | null | undefined> = [];
    for (const it of next) {
      // Exhaustive switch rather than if/else: the old `else` branch read
      // `.audio_url` off whatever wasn't a word, which silently breaks the
      // moment a third item type joins the queue.
      switch (it.type) {
        case 'word':
          urls.push(it.data.pronunciation_audio_url);
          break;
        case 'phrase':
          urls.push(it.data.audio_url);
          break;
        case 'can_do':
          // Nothing to preload — a can-do check is silent by design. Any audio
          // here would be a pronunciation hint.
          break;
      }
    }
    preloadAudioUrls(urls);
  }, [currentIndex, items]);

  // Direction alternates per item instead of being pinned to production
  // forever. user_words.direction / user_phrases.direction record the direction
  // of the LAST review, so flipping it tests each item both ways over time.
  // Recognition-only learners can't speak; production-only learners can't
  // follow a reply — both directions matter.
  const modeForItem = useCallback((item: ReviewItem): 'recognition' | 'production' => {
    // Can-dos are always unaided production; they have no stored direction.
    if (item.type === 'can_do') return 'production';
    return item.data.direction === 'production' ? 'recognition' : 'production';
  }, []);

  // Shared tail of every "this item is done" path, so the end-of-queue
  // handoff to the revision phase lives in exactly one place.
  const advance = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      setPhase(missedItemsRef.current.length > 0 ? 'transition' : 'done');
    } else {
      setCurrentIndex(nextIndex);
      setRevealed(false);
    }
  }, [currentIndex, items.length]);

  const handleCanDoSettled = useCallback((_result: CertifyResult) => {
    // The verdict is already persisted server-side; nothing to record here.
    // Certification deliberately does NOT feed the SRS — passing means the
    // capability is proven, not that a flashcard interval should move.
    advance();
  }, [advance]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleRate = useCallback((rating: Rating) => {
    if (!current) return;
    // Can-dos never render RatingButtons — they settle through their own
    // callback with a server-side verdict, not a self-report.
    if (current.type === 'can_do') return;

    if (rating === 'instant' || rating === 'got_it') {
      setCorrectCount(c => c + 1);
    }

    // Track forgot words for revision (words only, not phrases)
    if (rating === 'forgot' && current.type === 'word') {
      missedItemsRef.current = [...missedItemsRef.current, current.data];
      setMissedItems(missedItemsRef.current);
    }

    // A 403 here means the free-tier daily word limit, not a network problem,
    // and telling the learner to "check your connection" sends them to fix the
    // wrong thing. After the record route's gate moved to `!existing`, this
    // should now be unreachable from the review queue — every item in the queue
    // already has a user_words row — so it doubles as a canary for that gate
    // regressing.
    const recordFailure = (res?: Response) => {
      if (res?.status === 403) {
        toastError("That was a new word and you've hit today's free limit — it wasn't saved.");
        return;
      }
      toastError("Couldn't save that rating. Check your connection — we'll retry on next submit.");
    };

    const ratedMode = modeForItem(current);

    if (current.type === 'word') {
      fetch('/api/reviews/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: current.data.word_id,
          direction: ratedMode,
          rating,
          // The review queue is the only genuine delayed-retrieval surface in
          // the app; in-scene drills re-ask within seconds. The SRS treats the
          // two differently — see ReviewSourceEnum in types/api.ts.
          source: 'review',
        }),
      })
        .then((res) => { if (!res.ok) recordFailure(res); })
        .catch(() => recordFailure());
    } else {
      fetch('/api/reviews/record-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phraseId: current.data.phrase_id,
          rating,
          direction: ratedMode,
          source: 'review',
        }),
      })
        .then((res) => { if (!res.ok) recordFailure(res); })
        .catch(() => recordFailure());
    }

    advance();
  }, [current, modeForItem, advance]);

  const handleRevisionMnemonicContinue = useCallback(() => {
    setRevisionStep('quiz');
    setRevealed(false);
  }, []);

  const handleRevisionRate = useCallback((rating: Rating) => {
    if (rating === 'forgot') {
      // Move the failed item to the end of the revision queue so the user
      // doesn't see it again immediately — gives them a chance to recall it
      // after some distractor cards. Then re-show the mnemonic for context.
      setMissedItems((prev) => {
        if (prev.length <= 1) return prev; // nothing to rotate against
        const updated = [...prev];
        const [failed] = updated.splice(revisionIndex, 1);
        updated.push(failed);
        return updated;
      });
      // After rotation, the same revisionIndex now points to the NEXT card.
      // Re-show its mnemonic if available so the user enters fresh.
      if (missedItems.length > 1 && missedItems[(revisionIndex + 1) % missedItems.length]?.mnemonic_id) {
        setRevisionStep('mnemonic');
      } else if (missedItems[revisionIndex]?.mnemonic_id) {
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
        {otherLanguagesDue.length > 0 && (
          <Link
            href="/settings"
            className="mb-6 -mt-2 block rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 text-[13px] font-semibold text-[color:var(--foreground)] active:scale-[0.99] transition-transform"
          >
            {otherLanguagesDue.map((o) => `${o.count} in ${o.name}`).join(' · ')} still waiting —
            switch your learning language to review them ›
          </Link>
        )}
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
        reviewedWordIds={items.filter((i) => i.type === 'word').map((i) => i.data.word_id)}
        otherLanguagesDue={otherLanguagesDue}
        remaining={dueRemaining}
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
            // Deliberately production, not the alternating mode. The revision
            // round only happens after a `forgot`, and recognition here would
            // be trivially easy — the word was just on screen. This is an
            // intentional exception, not a missed refactor.
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
    return <ReviewComplete totalReviewed={0} correctCount={0} remaining={dueRemaining} />;
  }

  const activeMode = modeForItem(current);
  const modeLabel =
    current.type === 'can_do'
      ? 'Certify'
      : activeMode === 'recognition'
        ? 'Recognize'
        : 'Produce';

  return (
    <>
      <HeaderPortal>
        <span className="text-sm text-text-secondary truncate">
          {practiceMode ? 'Practice' : 'Review'} &middot; {currentIndex + 1}/{items.length}
          {/* The dashboard shows the uncapped due count, so a bare "3/20" here
              reads as the app losing items. Name the batch instead. */}
          {dueRemaining > 0 && ` of ${items.length + dueRemaining}`} &middot; {modeLabel}
        </span>
      </HeaderPortal>
      <ProgressBarPortal current={currentIndex + 1} total={items.length} />

      {showReviewInsight && reviewInsight && (
        <div className="mb-4">
          <InsightCard insight={reviewInsight} onDismiss={() => setShowReviewInsight(false)} />
        </div>
      )}

      {renderItem()}
    </>
  );

  // Switch rather than a ternary so a new item type is a compile-time
  // exhaustiveness decision instead of silently falling into the phrase arm.
  function renderItem() {
    if (!current) return null;
    switch (current.type) {
      case 'word':
        return (
          <ReviewCard
            key={current.data.word_id}
            word={toWord(current.data)}
            mnemonic={toMnemonic(current.data)}
            mode={activeMode}
            onReveal={handleReveal}
            revealed={revealed}
            onRate={handleRate}
            wordFamilies={wordFamiliesMap[current.data.word_id]}
          />
        );
      case 'can_do':
        return (
          <CanDoTest
            key={current.data.can_do_id}
            canDoId={current.data.can_do_id}
            sceneId={current.data.scene_id}
            statementEn={current.data.statement_en}
            promptEn={current.data.prompt_en}
            onSettled={handleCanDoSettled}
          />
        );
      case 'phrase':
        return (
          <>
            <PhraseReviewCard
              key={current.data.phrase_id}
              textTarget={current.data.text_target}
              textEn={current.data.text_en}
              literalTranslation={current.data.literal_translation}
              phraseBridgeSentence={current.data.phrase_bridge_sentence}
              compositeImageUrl={current.data.composite_image_url}
              words={phraseWordMap[current.data.phrase_id] ?? []}
              audioUrl={current.data.audio_url}
              languageCode={languageCode}
              mode={activeMode}
              onReveal={handleReveal}
              revealed={revealed}
            />
            {revealed && (
              <div className="mt-4">
                {/* Phrase cards don't self-render ratings the way ReviewCard
                    does — the buttons live here instead. */}
                <RatingButtons onRate={handleRate} />
              </div>
            )}
          </>
        );
    }
  }
}
