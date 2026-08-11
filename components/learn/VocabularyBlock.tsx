'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IntroduceBatch } from '@/components/learn/IntroduceBatch';
import { DrillBlock } from '@/components/learn/DrillBlock';
import { SceneCheckpoint } from '@/components/learn/SceneCheckpoint';
import { ConversationBlock } from '@/components/learn/ConversationBlock';
import type { LearnWord } from '@/types/learn';
import type { SupportedLanguageCode } from '@/types/audio';
import type { CueType, DrillQueue } from '@/lib/pedagogy/leitner';
import type { PedagogyFlags } from '@/lib/pedagogy/flags';
import type { ConversationExchange } from '@/lib/learn/conversation-data';
import {
  chunkIntoBatches,
  VOCAB_BATCH_SIZE,
  type V2BlockProgress,
  type V2InitialState,
} from '@/components/learn/v2-progress';

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
  /** Restore prior sub-state when the user re-enters a scene mid-phase. */
  initialState?: V2InitialState;
  /**
   * Fired when the introduce endpoint refuses a new word (free-tier daily
   * limit). IntroduceBatch has always detected this and called the callback;
   * until now nothing passed one, so the signal went nowhere and the learner
   * kept meeting words that were never saved.
   */
  onIntroduceBlocked?: (upgradeMessage: string | null) => void;
  /**
   * One short conversation per batch, played straight after that batch's
   * drill. Index is the batch index; an empty or missing entry means no
   * interlude for that batch. This is what stops the scene being a wall of
   * drilling with all the talking saved for the end.
   */
  interludes?: ConversationExchange[][];
  /** Context ConversationBlock needs; required only when interludes are passed. */
  conversationContext?: {
    learnerName: string | null;
    languageName: string;
    sceneId: string;
  };
  /** Fired after the end-of-vocab checkpoint resolves. */
  onComplete: () => void;
}

type Phase =
  | { kind: 'intro'; batchIndex: number }
  | { kind: 'drill'; batchIndex: number }
  | { kind: 'converse'; batchIndex: number }
  | { kind: 'checkpoint' };

export function VocabularyBlock({
  words,
  languageName,
  languageCode,
  flags,
  onItemAnswered,
  onProgress,
  initialState,
  onIntroduceBlocked,
  interludes,
  conversationContext,
  onComplete,
}: VocabularyBlockProps) {
  const batches = useMemo(() => chunkIntoBatches(words, VOCAB_BATCH_SIZE), [words]);

  const interludeFor = useCallback(
    (batchIndex: number): ConversationExchange[] | null => {
      if (!conversationContext) return null;
      const ex = interludes?.[batchIndex];
      return ex && ex.length > 0 ? ex : null;
    },
    [interludes, conversationContext],
  );

  const [phase, setPhase] = useState<Phase>(() => {
    if (batches.length === 0) return { kind: 'checkpoint' };
    if (initialState) {
      if (initialState.kind === 'checkpoint') return { kind: 'checkpoint' };
      const clamped = Math.max(0, Math.min(initialState.batchIndex, batches.length - 1));
      return { kind: initialState.kind, batchIndex: clamped };
    }
    return { kind: 'intro', batchIndex: 0 };
  });

  const [drillFraction, setDrillFraction] = useState(0);
  const drillInitialSize = useRef(0);

  const enabledCueTypes = useMemo<CueType[]>(() => {
    const out: CueType[] = ['recognition'];
    if (flags.production) out.push('production');
    if (flags.cloze) out.push('cloze');
    if (flags.speech) out.push('speak');
    return out;
  }, [flags.production, flags.cloze, flags.speech]);

  const recordReview = useCallback(
    (wordId: string, cueType: CueType, correct: boolean) => {
      const direction =
        cueType === 'production' || cueType === 'cloze' || cueType === 'speak'
          ? 'production'
          : 'recognition';
      onItemAnswered?.(wordId, correct, direction);
    },
    [onItemAnswered],
  );

  // Where a freshly mounted IntroduceBatch should open: 'start' when we arrive
  // forwards, 'end' when the learner backs out of the drill into it.
  const [introEntry, setIntroEntry] = useState<'start' | 'end'>('start');
  // Step-back closure registered by the mounted IntroduceBatch, so the block's
  // back walks its cards rather than skipping the whole batch.
  const introBackRef = useRef<(() => boolean) | null>(null);
  const registerIntroBack = useCallback((fn: (() => boolean) | null) => {
    introBackRef.current = fn;
  }, []);

  const advanceFromIntro = useCallback(() => {
    setPhase((p) =>
      p.kind === 'intro' ? { kind: 'drill', batchIndex: p.batchIndex } : p,
    );
    setDrillFraction(0);
    drillInitialSize.current = 0;
  }, []);

  const advanceFromDrill = useCallback(() => {
    setIntroEntry('start');
    setPhase((p) => {
      if (p.kind !== 'drill') return p;
      // Talk before moving on: use what was just drilled (plus everything
      // earlier — the planner picks for cumulative coverage) in a real
      // exchange while it's still warm.
      if (interludeFor(p.batchIndex)) return { kind: 'converse', batchIndex: p.batchIndex };
      const next = p.batchIndex + 1;
      if (next >= batches.length) return { kind: 'checkpoint' };
      return { kind: 'intro', batchIndex: next };
    });
  }, [batches.length, interludeFor]);

  const advanceFromConverse = useCallback(() => {
    setIntroEntry('start');
    setPhase((p) => {
      if (p.kind !== 'converse') return p;
      const next = p.batchIndex + 1;
      if (next >= batches.length) return { kind: 'checkpoint' };
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
  // Each batch contributes 2 slots (intro + drill), plus a 3rd when it has a
  // conversation interlude; the checkpoint is the final slot. Counting the
  // interludes exactly keeps the progress bar honest rather than jumping.
  const { slotOffsets, totalSlots } = useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (let i = 0; i < batches.length; i++) {
      offsets.push(acc);
      acc += 2 + (interludeFor(i) ? 1 : 0);
    }
    return { slotOffsets: offsets, totalSlots: acc + 1 };
  }, [batches.length, interludeFor]);

  /** Where "back" lands at the end of a batch: its interlude if it had one. */
  const tailOf = useCallback(
    (batchIndex: number): Phase =>
      interludeFor(batchIndex)
        ? { kind: 'converse', batchIndex }
        : { kind: 'drill', batchIndex },
    [interludeFor],
  );

  const goBack = useCallback((): boolean => {
    if (phase.kind === 'checkpoint') {
      if (batches.length === 0) return false;
      setPhase(tailOf(batches.length - 1));
      return true;
    }
    if (phase.kind === 'converse') {
      setPhase({ kind: 'drill', batchIndex: phase.batchIndex });
      return true;
    }
    if (phase.kind === 'drill') {
      // Land on the batch handoff ("You've met them all"), which is the screen
      // the learner actually came from — not word 1 of the batch.
      setIntroEntry('end');
      setPhase({ kind: 'intro', batchIndex: phase.batchIndex });
      setDrillFraction(0);
      drillInitialSize.current = 0;
      return true;
    }
    // intro: walk the cards first, and only leave the batch once at card 1.
    if (introBackRef.current?.()) return true;
    if (phase.batchIndex > 0) {
      setPhase(tailOf(phase.batchIndex - 1));
      return true;
    }
    return false;
  }, [phase, batches.length, tailOf]);

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
      fraction = slotOffsets[phase.batchIndex] / totalSlots;
    } else if (phase.kind === 'converse') {
      fraction = (slotOffsets[phase.batchIndex] + 2) / totalSlots;
    } else {
      // drill
      fraction = (slotOffsets[phase.batchIndex] + 1 + drillFraction) / totalSlots;
    }
    const batchIndex = phase.kind === 'checkpoint' ? batches.length : phase.batchIndex;
    onProgress({
      fraction: Math.max(0, Math.min(1, fraction)),
      goBack: () => goBackRef.current(),
      kind: phase.kind,
      batchIndex,
    });
  }, [phase, drillFraction, totalSlots, slotOffsets, onProgress, batches.length]);

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

  if (phase.kind === 'converse') {
    const exchanges = interludeFor(phase.batchIndex);
    if (exchanges && conversationContext) {
      return (
        <ConversationBlock
          key={`converse-${phase.batchIndex}`}
          exchanges={exchanges}
          learnerName={conversationContext.learnerName}
          languageName={conversationContext.languageName}
          languageCode={languageCode}
          sceneId={conversationContext.sceneId}
          onComplete={advanceFromConverse}
        />
      );
    }
    // Interlude vanished (words re-filtered between sessions) — don't strand
    // the learner on an empty phase.
    advanceFromConverse();
    return null;
  }

  const batch = batches[phase.batchIndex];
  const globalIndexStart = phase.batchIndex * VOCAB_BATCH_SIZE;

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
        onIntroduceBlocked={onIntroduceBlocked}
        startAtEnd={introEntry === 'end'}
        registerBack={registerIntroBack}
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
