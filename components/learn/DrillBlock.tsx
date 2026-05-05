'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { QuizOptions } from '@/components/learn/QuizOptions';
import { ProductionTyping } from '@/components/learn/ProductionTyping';
import { Cloze } from '@/components/learn/Cloze';
import { ConfidenceButtons } from '@/components/learn/ConfidenceButtons';
import type { LearnWord } from '@/components/learn/LearnClient';
import type { SupportedLanguageCode } from '@/types/audio';
import {
  buildQueue,
  applyCorrect,
  applyWrong,
  currentItem,
  type CueType,
  type DrillItem,
  type DrillQueue,
} from '@/lib/pedagogy/leitner';
import { pickCueType, eligibleCueTypes, type PickerEligibility } from '@/lib/pedagogy/exercise-picker';
import { fireTelemetry } from '@/lib/pedagogy/telemetry';

interface DrillBlockProps {
  /** Words being drilled this block. Order is the introduce order. */
  words: LearnWord[];
  languageCode?: SupportedLanguageCode;
  /** Which cue types are available this build (Phase 4 ships recognition + production; Phase 5 adds cloze + listening). */
  enabledCueTypes?: CueType[];
  /** K — distinct cue types each item must pass before being removed. */
  requiredCueTypes?: number;
  /** Reseed the queue with these items already passing the given cue types (for resume). */
  initialQueue?: DrillQueue | null;
  /** Fired on every queue change so the parent can persist drill_state. */
  onQueueChange?: (queue: DrillQueue) => void;
  /** Records SRS reviews as the drill progresses. `confidence==='guessed'` downgrades the SRS rating. */
  onItemAnswered?: (wordId: string, cueType: CueType, correct: boolean, confidence?: 'knew_it' | 'guessed') => void;
  /** Show "I knew it / I guessed" buttons after first-attempt correct. */
  showConfidence?: boolean;
  /** Fired when the queue empties. */
  onComplete: (queue: DrillQueue) => void;
}

interface BatchEligibilityMap {
  [wordId: string]: PickerEligibility;
}

export function DrillBlock({
  words,
  languageCode,
  enabledCueTypes = ['recognition', 'production'],
  requiredCueTypes = 2,
  initialQueue,
  onQueueChange,
  onItemAnswered,
  showConfidence = false,
  onComplete,
}: DrillBlockProps) {
  const eligibilityMap = useMemo<BatchEligibilityMap>(() => {
    const out: BatchEligibilityMap = {};
    for (const w of words) {
      out[w.word.id] = {
        hasMnemonic: !!w.mnemonic,
        hasAudioUrl: !!w.word.pronunciation_audio_url,
        hasClozePhrase: !!(w.clozePhrases && w.clozePhrases.length > 0),
        clozeEnabled: enabledCueTypes.includes('cloze') || enabledCueTypes.includes('listening'),
      };
    }
    return out;
  }, [words, enabledCueTypes]);

  const [queue, setQueue] = useState<DrillQueue>(() => {
    if (initialQueue && initialQueue.items.length > 0) {
      return { ...initialQueue, requiredCueTypes };
    }
    return buildQueue(
      words.map((w) => ({
        itemId: w.word.id,
        itemType: 'word' as const,
        refId: w.word.id,
      })),
      { requiredCueTypes },
    );
  });

  const [activeCueType, setActiveCueType] = useState<CueType>(() => {
    const item = currentItem(queue);
    if (!item) return 'recognition';
    return pickCueType(item, eligibilityMap[item.itemId] ?? defaultEligibility());
  });

  const [attemptKey, setAttemptKey] = useState(0);
  const completedRef = useRef(false);
  /** True when the current item's last user-answer was wrong; suppresses
   * the auto-reveal `onCorrect` callback that QuizOptions fires after
   * showing the right answer. */
  const lastWrongRef = useRef(false);
  /** Pending confidence pick: while non-null, the queue does NOT advance —
   * we're waiting for the learner to tap "I knew it" or "I guessed". */
  const [pendingConfidence, setPendingConfidence] = useState<{
    cueType: CueType;
    wordId: string;
  } | null>(null);

  // Persist queue + handle completion. Empty queue → done.
  useEffect(() => {
    onQueueChange?.(queue);
    if (queue.items.length === 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete(queue);
    }
  }, [queue, onQueueChange, onComplete]);

  // When the active item changes, pick a new cue type for it.
  useEffect(() => {
    const item = currentItem(queue);
    if (!item) return;
    const elig = eligibilityMap[item.itemId] ?? defaultEligibility();
    setActiveCueType(pickCueType(item, elig));
    setAttemptKey((k) => k + 1);
    lastWrongRef.current = false;
    setPendingConfidence(null);
  }, [queue.cursor, queue.items.length, eligibilityMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceCorrect = useCallback(
    (confidence: 'knew_it' | 'guessed' | null) => {
      const item = currentItem(queue);
      if (!item) return;
      onItemAnswered?.(item.itemId, activeCueType, true, confidence ?? undefined);
      fireTelemetry({
        event: 'drill_correct',
        payload: { wordId: item.itemId, cueType: activeCueType, tries: item.tries + 1, confidence },
      });
      if (confidence === 'guessed') {
        // Mark the cue type passed but ALSO push the item to the back so it
        // resurfaces. Implemented as: applyCorrect (records cue type), then
        // if the item didn't fully pass yet, the next pick will surface it.
        // For lower priority we use applyWrong instead — re-queue with gap=3.
        setQueue((q) => applyWrong(q, activeCueType, 3));
        return;
      }
      setQueue((q) => applyCorrect(q, activeCueType, confidence));
    },
    [queue, activeCueType, onItemAnswered],
  );

  const handleCorrect = useCallback(() => {
    // Suppress the auto-reveal onCorrect that QuizOptions fires after a
    // wrong answer — we already accounted for the wrong via onAnswer.
    if (lastWrongRef.current) {
      lastWrongRef.current = false;
      return;
    }
    const item = currentItem(queue);
    if (!item) return;
    if (showConfidence && item.tries === 0) {
      // First-attempt correct — defer queue advance until learner picks
      // confidence. The queue stays put; the exercise component already
      // showed its celebration, so the buttons appear under it.
      setPendingConfidence({ cueType: activeCueType, wordId: item.itemId });
      return;
    }
    advanceCorrect(null);
  }, [queue, activeCueType, showConfidence, advanceCorrect]);

  const handleWrong = useCallback(() => {
    lastWrongRef.current = true;
    const item = currentItem(queue);
    if (!item) return;
    onItemAnswered?.(item.itemId, activeCueType, false);
    fireTelemetry({
      event: 'drill_wrong',
      payload: { wordId: item.itemId, cueType: activeCueType, tries: item.tries + 1 },
    });
    setQueue((q) => applyWrong(q, activeCueType, 2));
  }, [queue, activeCueType, onItemAnswered]);

  const handleConfidencePick = useCallback(
    (confidence: 'knew_it' | 'guessed') => {
      setPendingConfidence(null);
      advanceCorrect(confidence);
    },
    [advanceCorrect],
  );

  const item = currentItem(queue);
  if (!item) return null;

  const word = words.find((w) => w.word.id === item.itemId);
  if (!word) {
    // Defensive: queue refers to a word not in the batch — drop it.
    setQueue((q) => applyCorrect(q, activeCueType));
    return null;
  }

  // Header strip: "1 of 3 left · production"
  const header = (
    <div className="text-center mb-2">
      <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)]">
        {queue.items.length} left · {humanCueType(activeCueType)}
      </p>
    </div>
  );

  const confidenceFooter = pendingConfidence ? (
    <ConfidenceButtons
      key={`conf-${pendingConfidence.wordId}-${pendingConfidence.cueType}`}
      wordId={pendingConfidence.wordId}
      cueType={pendingConfidence.cueType}
      onPick={handleConfidencePick}
    />
  ) : null;

  if (activeCueType === 'cloze' && word.clozePhrases && word.clozePhrases.length > 0) {
    return (
      <>
        {header}
        <Cloze
          key={`drill-cloze-${item.itemId}-${attemptKey}`}
          correctTarget={word.word.text}
          wordId={word.word.id}
          meaningEn={word.word.meaning_en}
          phrases={word.clozePhrases.map((p) => ({
            phrase_id: p.phrase_id,
            text_target: p.text_target,
            text_en: p.text_en,
            word_text: p.word_text,
            audio_url: null,
          }))}
          onCorrect={handleCorrect}
          onAnswer={(correct) => {
            if (!correct) handleWrong();
          }}
        />
        {confidenceFooter}
      </>
    );
  }

  if (activeCueType === 'production') {
    return (
      <>
        {header}
        <ProductionTyping
          key={`drill-prod-${item.itemId}-${attemptKey}`}
          promptEn={word.word.meaning_en}
          correctTarget={word.word.text}
          targetLanguageCode={languageCode}
          wordId={word.word.id}
          audioUrl={word.word.pronunciation_audio_url}
          onCorrect={handleCorrect}
          onAnswer={(correct, attempts) => {
            // ProductionTyping handles its own retry UX. We mark the queue
            // item as wrong on the second wrong attempt so it re-queues
            // even though the user will eventually type the revealed answer.
            if (!correct && attempts === 2) handleWrong();
          }}
        />
        {confidenceFooter}
      </>
    );
  }

  // Recognition (default)
  return (
    <>
      {header}
      <QuizOptions
        key={`drill-rec-${item.itemId}-${attemptKey}`}
        wordText={word.word.text}
        wordId={word.word.id}
        correctAnswer={word.word.meaning_en}
        distractors={word.distractors}
        onCorrect={handleCorrect}
        onAnswer={(correct) => {
          if (!correct) handleWrong();
        }}
        revealMaskMs={1500}
      />
      {confidenceFooter}
    </>
  );
}

function humanCueType(cue: CueType): string {
  switch (cue) {
    case 'recognition': return 'meaning';
    case 'production': return 'spell it';
    case 'cloze': return 'fill the blank';
    case 'listening': return 'hear & type';
    case 'pattern': return 'pattern';
  }
}

function defaultEligibility(): PickerEligibility {
  return { hasMnemonic: false, hasAudioUrl: false, hasClozePhrase: false, clozeEnabled: false };
}

// Re-export for parents wiring the queue via DB resume.
export { eligibleCueTypes };
