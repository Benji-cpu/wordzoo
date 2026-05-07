'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IntroduceBatch } from '@/components/learn/IntroduceBatch';
import { DrillBlock } from '@/components/learn/DrillBlock';
import { SceneCheckpoint } from '@/components/learn/SceneCheckpoint';
import type { LearnWord } from '@/types/learn';
import type { SupportedLanguageCode } from '@/types/audio';
import type { CueType, DrillQueue } from '@/lib/pedagogy/leitner';
import type { PedagogyFlags } from '@/lib/pedagogy/flags';
import type { V2BlockProgress } from '@/components/learn/v2-progress';

const BATCH_SIZE = 3;

interface VocabularyBlockProps {
  words: LearnWord[];
  languageName: string;
  languageCode?: SupportedLanguageCode;
  flags: PedagogyFlags;
  /** Bridges drill answers back into the parent's SRS write path. */
  onItemAnswered?: (
    wordId: string,
    correct: boolean,
    direction: 'recognition' | 'production',
  ) => void;
  /** Fired on every internal state change so the parent can drive its
   * progress bar + intercept the back button. */
  onProgress?: (progress: V2BlockProgress) => void;
  /** Fired after the end-of-vocab checkpoint resolves. */
  onComplete: () => void;
}

type Phase =
  | { kind: 'intro'; batchIndex: number }
  | { kind: 'drill'; batchIndex: number }
  | { kind: 'checkpoint' };

export function VocabularyBlock({
  words,
  languageName,
  languageCode,
  flags,
  onItemAnswered,
  onProgress,
  onComplete,
}: VocabularyBlockProps) {
  const batches = useMemo(() => {
    const out: LearnWord[][] = [];
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
      out.push(words.slice(i, i + BATCH_SIZE));
    }
    return out;
  }, [words]);

  const [phase, setPhase] = useState<Phase>(() =>
    batches.length > 0
      ? { kind: 'intro', batchIndex: 0 }
      : { kind: 'checkpoint' },
  );

  const [drillFraction, setDrillFraction] = useState(0);
  const drillInitialSize = useRef(0);

  const enabledCueTypes = useMemo<CueType[]>(() => {
    const out: CueType[] = ['recognition'];
    if (flags.production) out.push('production');
    if (flags.cloze) out.push('cloze');
    return out;
  }, [flags.production, flags.cloze]);

  const recordReview = useCallback(
    (wordId: string, cueType: CueType, correct: boolean) => {
      const direction =
        cueType === 'production' || cueType === 'cloze' ? 'production' : 'recognition';
      onItemAnswered?.(wordId, correct, direction);
    },
    [onItemAnswered],
  );

  const advanceFromIntro = useCallback(() => {
    setPhase((p) =>
      p.kind === 'intro' ? { kind: 'drill', batchIndex: p.batchIndex } : p,
    );
    setDrillFraction(0);
    drillInitialSize.current = 0;
  }, []);

  const advanceFromDrill = useCallback(() => {
    setPhase((p) => {
      if (p.kind !== 'drill') return p;
      const next = p.batchIndex + 1;
      if (next >= batches.length) {
        return { kind: 'checkpoint' };
      }
      return { kind: 'intro', batchIndex: next };
    });
  }, [batches.length]);

  const handleDrillQueueChange = useCallback((queue: DrillQueue) => {
    if (drillInitialSize.current === 0 && queue.items.length > 0) {
      drillInitialSize.current = queue.items.length;
    }
    const initial = drillInitialSize.current || 1;
    const remaining = queue.items.length;
    setDrillFraction(Math.max(0, Math.min(1, 1 - remaining / initial)));
  }, []);

  // Compute fraction + goBack on every state change and report up.
  // Granularity: each batch contributes 2 slots (intro + drill); checkpoint
  // is a 3rd-rail final slot. Within drill, drillFraction interpolates.
  const totalSlots = batches.length * 2 + 1;
  const goBack = useCallback((): boolean => {
    if (phase.kind === 'checkpoint') {
      if (batches.length === 0) return false;
      setPhase({ kind: 'drill', batchIndex: batches.length - 1 });
      return true;
    }
    if (phase.kind === 'drill') {
      setPhase({ kind: 'intro', batchIndex: phase.batchIndex });
      setDrillFraction(0);
      drillInitialSize.current = 0;
      return true;
    }
    // intro
    if (phase.batchIndex > 0) {
      setPhase({ kind: 'drill', batchIndex: phase.batchIndex - 1 });
      return true;
    }
    return false;
  }, [phase, batches.length]);

  // Latest goBack closure — wrap in a ref so the callback we hand the parent
  // always points at the current phase without forcing the parent to re-run
  // its onProgress effect on every state change.
  const goBackRef = useRef(goBack);
  useEffect(() => {
    goBackRef.current = goBack;
  }, [goBack]);

  useEffect(() => {
    if (!onProgress) return;
    let fraction: number;
    if (phase.kind === 'checkpoint') {
      fraction = 1;
    } else if (phase.kind === 'intro') {
      fraction = (phase.batchIndex * 2) / totalSlots;
    } else {
      // drill
      fraction =
        (phase.batchIndex * 2 + 1 + drillFraction) / totalSlots;
    }
    onProgress({
      fraction: Math.max(0, Math.min(1, fraction)),
      goBack: () => goBackRef.current(),
    });
  }, [phase, drillFraction, totalSlots, onProgress]);

  if (words.length === 0) {
    // No vocabulary in this scene — let the parent skip to summary.
    onComplete();
    return null;
  }

  if (phase.kind === 'checkpoint') {
    return (
      <SceneCheckpoint
        items={words}
        languageCode={languageCode}
        onItemAnswered={(wordId, correct) => {
          onItemAnswered?.(wordId, correct, 'production');
        }}
        onComplete={onComplete}
      />
    );
  }

  const batch = batches[phase.batchIndex];
  const globalIndexStart = phase.batchIndex * BATCH_SIZE;

  if (phase.kind === 'intro') {
    return (
      <IntroduceBatch
        key={`intro-${phase.batchIndex}`}
        words={batch}
        batchIndex={phase.batchIndex}
        globalIndexStart={globalIndexStart}
        totalWords={words.length}
        languageName={languageName}
        languageCode={languageCode}
        recordIntroduce={flags.mastery}
        onComplete={advanceFromIntro}
      />
    );
  }

  // phase.kind === 'drill'
  return (
    <DrillBlock
      key={`drill-${phase.batchIndex}`}
      words={batch}
      languageCode={languageCode}
      enabledCueTypes={enabledCueTypes}
      onQueueChange={handleDrillQueueChange}
      onItemAnswered={recordReview}
      onComplete={advanceFromDrill}
    />
  );
}
