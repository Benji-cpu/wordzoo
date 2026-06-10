'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { QuizOptions } from '@/components/learn/QuizOptions';
import { ProductionTyping } from '@/components/learn/ProductionTyping';
import { Cloze } from '@/components/learn/Cloze';
import type { LearnWord } from '@/types/learn';
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
import { emitDiag } from '@/lib/feedback/diag';
import { Fox } from '@/components/mascot/Fox';
import { DrillProgressHeader } from '@/components/learn/DrillProgressDots';

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
  /** Records SRS reviews as the drill progresses. */
  onItemAnswered?: (wordId: string, cueType: CueType, correct: boolean) => void;
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

  // Persist queue + handle completion. Empty queue → done.
  useEffect(() => {
    onQueueChange?.(queue);
    if (queue.items.length === 0 && !completedRef.current) {
      completedRef.current = true;
      onComplete(queue);
    }
  }, [queue, onQueueChange, onComplete]);

  // Signal that changes whenever a fresh exercise should be presented:
  // either a different item rotates to the cursor, or the same item is
  // re-presented after an answer (applyCorrect/applyWrong always bump
  // `tries`). Keying the effect on cursor/items.length alone strands the
  // learner on single-item drills — a lone word in the final odd-sized
  // batch re-queues at the same cursor, so neither dep changes, the cue
  // type never advances, and clicking the answer never continues.
  const stepItem = currentItem(queue);
  const drillStep = stepItem
    ? `${stepItem.itemId}#${stepItem.tries}`
    : `done#${queue.items.length}`;

  // When the active item (or its attempt count) changes, pick a new cue type.
  useEffect(() => {
    const item = currentItem(queue);
    if (!item) return;
    const elig = eligibilityMap[item.itemId] ?? defaultEligibility();
    setActiveCueType(pickCueType(item, elig));
    setAttemptKey((k) => k + 1);
    lastWrongRef.current = false;
  }, [drillStep, eligibilityMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceCorrect = useCallback(() => {
    const item = currentItem(queue);
    if (!item) return;
    onItemAnswered?.(item.itemId, activeCueType, true);
    fireTelemetry({
      event: 'drill_correct',
      payload: { wordId: item.itemId, cueType: activeCueType, tries: item.tries + 1 },
    });
    setQueue((q) => applyCorrect(q, activeCueType));
  }, [queue, activeCueType, onItemAnswered]);

  const handleCorrect = useCallback(() => {
    // Suppress the auto-reveal onCorrect that QuizOptions fires after a
    // wrong answer — we already accounted for the wrong via onAnswer.
    if (lastWrongRef.current) {
      lastWrongRef.current = false;
      return;
    }
    const item = currentItem(queue);
    if (!item) return;
    advanceCorrect();
  }, [queue, advanceCorrect]);

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

  // Recovery: cursor past the end while items still exist (shouldn't happen,
  // but if it does, snap back to a valid index in an effect — never call
  // setState during render).
  useEffect(() => {
    if (queue.items.length > 0 && (queue.cursor < 0 || queue.cursor >= queue.items.length)) {
      emitDiag(`DrillBlock cursor out of bounds: ${queue.cursor}/${queue.items.length}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQueue((q) => ({ ...q, cursor: 0 }));
    }
  }, [queue.cursor, queue.items.length]);

  // Recovery: queue references a word not in the batch — drop it from
  // an effect, never during render.
  useEffect(() => {
    const it = currentItem(queue);
    if (!it) return;
    const w = words.find((wd) => wd.word.id === it.itemId);
    if (!w) {
      emitDiag(`DrillBlock missing word ${it.itemId} in batch of ${words.length}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQueue((q) => applyCorrect(q, activeCueType));
    }
  }, [queue, words, activeCueType]);

  const item = currentItem(queue);
  const word = item ? words.find((w) => w.word.id === item.itemId) : null;

  // Loading placeholder while between items / between batch transitions.
  // Renders the fox so the user never sees a blank screen mid-flow.
  if (!item || !word) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[40vh] py-12 animate-pulse">
        <Fox pose="thinking" size="sm" aria-label="Loading next exercise" />
        <p className="mt-3 text-xs text-[color:var(--text-secondary)]">Wrapping up…</p>
      </div>
    );
  }

  // Header strip: "2 of 3 locked in · production" + per-item mastery dots
  const header = (
    <DrillProgressHeader queue={queue} cueLabel={humanCueType(activeCueType)} />
  );

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
