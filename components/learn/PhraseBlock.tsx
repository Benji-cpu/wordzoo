'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhraseCard } from '@/components/learn/PhraseCard';
import { PhraseBreakdown } from '@/components/learn/PhraseBreakdown';
import { PhraseDrillBlock } from '@/components/learn/PhraseDrillBlock';
import { PhraseCheckpoint } from '@/components/learn/PhraseCheckpoint';
import { ConversationBlock } from '@/components/learn/ConversationBlock';
import type { ScenePhraseWithMnemonics } from '@/types/database';
import type { SupportedLanguageCode } from '@/types/audio';
import type { CueType, DrillQueue } from '@/lib/pedagogy/leitner';
import type { PedagogyFlags } from '@/lib/pedagogy/flags';
import type { ConversationExchange } from '@/lib/learn/conversation-data';
import { reviewMinutes } from '@/lib/pedagogy/gate';
import {
  chunkIntoBatches,
  PHRASE_BATCH_SIZE,
  type V2BlockProgress,
  type V2InitialState,
} from '@/components/learn/v2-progress';

interface PhraseBlockProps {
  phrases: ScenePhraseWithMnemonics[];
  languageCode?: SupportedLanguageCode;
  flags: PedagogyFlags;
  /** Bridges drill answers back to /api/reviews/record-phrase. */
  onItemAnswered?: (phraseId: string, correct: boolean) => void;
  /** Fired on every internal state change so the parent can drive its
   * progress bar + intercept the back button. */
  onProgress?: (progress: V2BlockProgress) => void;
  /** Restore prior sub-state when the user re-enters a scene mid-phase. */
  initialState?: V2InitialState;
  /** One short conversation per batch, played straight after that batch's drill. */
  interludes?: ConversationExchange[][];
  /** Context ConversationBlock needs; required only when interludes are passed. */
  conversationContext?: {
    learnerName: string | null;
    sceneId: string;
  };
  /** Fired after the end-of-phrases checkpoint resolves. */
  onComplete: () => void;
}

type IntroStep = { phraseIdx: number; sub: 'card' | 'breakdown' };
type Phase =
  | { kind: 'intro'; batchIndex: number }
  | { kind: 'drill'; batchIndex: number }
  | { kind: 'converse'; batchIndex: number }
  | { kind: 'checkpoint' }
  // After the checkpoint: the pause point (lock these in now, or go on).
  | { kind: 'handoff' };

/**
 * Pedagogy v2 phrases phase orchestrator. Mirrors VocabularyBlock for
 * vocab. Renders inline inside SceneFlowClient (no shell/header — the
 * parent owns those). When `flags.restructure` is off, the parent
 * keeps its legacy show → quiz rendering instead.
 *
 * Flow per batch (default 2 phrases):
 *   PhraseCard → PhraseBreakdown (skipped if no word mnemonics)
 *   → next phrase → handoff button → PhraseDrillBlock
 * After last batch:
 *   PhraseCheckpoint over every phrase in the scene → handoff → onComplete
 * The handoff offers a review round on these phrases before the words.
 */
export function PhraseBlock({
  phrases,
  languageCode,
  flags,
  onItemAnswered,
  onProgress,
  initialState,
  interludes,
  conversationContext,
  onComplete,
}: PhraseBlockProps) {
  const router = useRouter();
  const [lockingIn, setLockingIn] = useState(false);
  const batches = useMemo(() => chunkIntoBatches(phrases, PHRASE_BATCH_SIZE), [phrases]);

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
    return out;
  }, [flags.production, flags.cloze]);

  // Where a freshly mounted PhraseIntroBatch should open: 'start' arriving
  // forwards, 'end' when the learner backs out of the drill into it.
  const [introEntry, setIntroEntry] = useState<'start' | 'end'>('start');
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

  // Each batch is intro + drill, plus a 3rd slot when it has an interlude.
  const { slotOffsets, totalSlots } = useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (let i = 0; i < batches.length; i++) {
      offsets.push(acc);
      acc += 2 + (interludeFor(i) ? 1 : 0);
    }
    return { slotOffsets: offsets, totalSlots: acc + 1 };
  }, [batches.length, interludeFor]);

  const tailOf = useCallback(
    (batchIndex: number): Phase =>
      interludeFor(batchIndex)
        ? { kind: 'converse', batchIndex }
        : { kind: 'drill', batchIndex },
    [interludeFor],
  );

  // Leave for /review with this scene's items first. The parent normally saves
  // "phrases done, now vocabulary" when onComplete fires; going to /review
  // skips that, so save the same progress here or Ben would resume at the
  // checkpoint instead of the words. Navigation goes ahead even if the save fails.
  const lockInNow = useCallback(async () => {
    const sceneId = phrases[0]?.scene_id;
    if (!sceneId || lockingIn) return;
    setLockingIn(true);
    try {
      await fetch(`/api/scenes/${sceneId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPhase: 'vocabulary',
          phaseIndex: 0,
          phaseCompleted: 'phrases',
          phaseStep: null,
          phaseBatch: 0,
        }),
      });
    } catch {
      // Offline: resume lands back on the phrase checkpoint, which is safe.
    }
    router.push(`/review?scene=${sceneId}`);
  }, [phrases, lockingIn, router]);

  const goBack = useCallback((): boolean => {
    if (phase.kind === 'handoff') {
      if (batches.length === 0) return false;
      setPhase(tailOf(batches.length - 1));
      return true;
    }
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
      // Land on the batch handoff ("You've seen the breakdown"), the screen the
      // learner actually came from — not phrase 1 of the batch.
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

  const goBackRef = useRef(goBack);
  useEffect(() => {
    goBackRef.current = goBack;
  }, [goBack]);

  useEffect(() => {
    if (!onProgress) return;
    let fraction: number;
    if (phase.kind === 'checkpoint' || phase.kind === 'handoff') {
      fraction = 1;
    } else if (phase.kind === 'intro') {
      fraction = slotOffsets[phase.batchIndex] / totalSlots;
    } else if (phase.kind === 'converse') {
      fraction = (slotOffsets[phase.batchIndex] + 2) / totalSlots;
    } else {
      fraction = (slotOffsets[phase.batchIndex] + 1 + drillFraction) / totalSlots;
    }
    const batchIndex =
      phase.kind === 'checkpoint' || phase.kind === 'handoff' ? batches.length : phase.batchIndex;
    onProgress({
      fraction: Math.max(0, Math.min(1, fraction)),
      goBack: () => goBackRef.current(),
      // The handoff reports as the checkpoint: same saved sub-state, no new save.
      kind: phase.kind === 'handoff' ? 'checkpoint' : phase.kind,
      batchIndex,
    });
  }, [phase, drillFraction, totalSlots, slotOffsets, onProgress, batches.length]);

  if (phrases.length === 0) {
    onComplete();
    return null;
  }

  if (phase.kind === 'checkpoint') {
    return (
      <PhraseCheckpoint
        items={phrases}
        scenePhrases={phrases}
        onItemAnswered={onItemAnswered}
        onComplete={() => setPhase({ kind: 'handoff' })}
      />
    );
  }

  if (phase.kind === 'handoff') {
    const minutes = reviewMinutes(phrases.length);
    return (
      <div className="flex flex-col items-center justify-center text-center flex-1 min-h-0 py-12 px-6 animate-spring-in">
        <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)] mb-3">
          {phrases.length} phrases done
        </p>
        <h2
          className="font-display text-[color:var(--color-fox-primary)] leading-[0.95] mb-4"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)' }}
        >
          Now the words
        </h2>
        <p className="text-sm text-[color:var(--text-secondary)] max-w-sm mb-8">
          A quick round on these phrases while they&apos;re fresh helps them stick.
          Your place is saved either way.
        </p>
        <button
          type="button"
          onClick={() => onComplete()}
          disabled={lockingIn}
          className="rounded-xl bg-[color:var(--color-fox-primary)] text-white font-bold py-3 px-6 active:scale-[0.98] transition disabled:opacity-50"
        >
          Continue to the words →
        </button>
        <button
          type="button"
          onClick={() => void lockInNow()}
          disabled={lockingIn}
          className="mt-3 rounded-xl border border-[color:var(--border-default)] text-[color:var(--foreground)] font-semibold text-sm py-3 px-6 active:scale-[0.98] transition disabled:opacity-50"
        >
          {lockingIn ? 'Opening review…' : `Lock in these phrases now (≈${minutes} min)`}
        </button>
      </div>
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
          languageCode={languageCode}
          sceneId={conversationContext.sceneId}
          onComplete={advanceFromConverse}
        />
      );
    }
    advanceFromConverse();
    return null;
  }

  const batch = batches[phase.batchIndex];

  if (phase.kind === 'intro') {
    return (
      <PhraseIntroBatch
        key={`intro-${phase.batchIndex}`}
        batchIndex={phase.batchIndex}
        batch={batch}
        totalPhrases={phrases.length}
        globalIndexStart={phase.batchIndex * PHRASE_BATCH_SIZE}
        languageCode={languageCode}
        startAtEnd={introEntry === 'end'}
        registerBack={registerIntroBack}
        onComplete={advanceFromIntro}
      />
    );
  }

  // phase.kind === 'drill'
  return (
    <PhraseDrillBlock
      key={`drill-${phase.batchIndex}`}
      phrases={batch}
      scenePhrases={phrases}
      languageCode={languageCode}
      enabledCueTypes={enabledCueTypes}
      onItemAnswered={(phraseId, _cueType, correct) => {
        onItemAnswered?.(phraseId, correct);
      }}
      onQueueChange={handleDrillQueueChange}
      onComplete={advanceFromDrill}
    />
  );
}

// ──────────────────────────────────────────────────────────
// Inline introduce-batch component for phrases.
// PhraseCard → PhraseBreakdown (if any word has a mnemonic) per phrase,
// then a handoff button to start the drill.
// ──────────────────────────────────────────────────────────

interface PhraseIntroBatchProps {
  batchIndex: number;
  batch: ScenePhraseWithMnemonics[];
  totalPhrases: number;
  globalIndexStart: number;
  languageCode?: SupportedLanguageCode;
  /** Enter on the handoff screen instead of card 1 (backing out of the drill). */
  startAtEnd?: boolean;
  /** Hands the parent a closure that steps back one card; false when at card 1. */
  registerBack?: (goBack: (() => boolean) | null) => void;
  onComplete: () => void;
}

function PhraseIntroBatch({
  batchIndex,
  batch,
  totalPhrases,
  globalIndexStart,
  languageCode,
  startAtEnd,
  registerBack,
  onComplete,
}: PhraseIntroBatchProps) {
  const steps = useMemo<IntroStep[]>(() => {
    const out: IntroStep[] = [];
    batch.forEach((p, i) => {
      out.push({ phraseIdx: i, sub: 'card' });
      const hasMnemonicWord = p.words.some((w) => w.keyword_text || w.image_url);
      if (hasMnemonicWord) out.push({ phraseIdx: i, sub: 'breakdown' });
    });
    return out;
  }, [batch]);

  // `startAtEnd` is read on mount only — the parent remounts this component
  // (keyed by batch) whenever it wants a different entry point.
  const [stepIdx, setStepIdx] = useState(() => (startAtEnd ? Math.max(0, steps.length - 1) : 0));
  const [readyToDrill, setReadyToDrill] = useState(Boolean(startAtEnd));

  const advance = useCallback(() => {
    if (stepIdx + 1 >= steps.length) {
      setReadyToDrill(true);
      return;
    }
    setStepIdx((i) => i + 1);
  }, [stepIdx, steps.length]);

  /** Exact reverse of `advance`: handoff → last card → … → first card. */
  const goBack = useCallback((): boolean => {
    if (readyToDrill) {
      setReadyToDrill(false);
      return true;
    }
    if (stepIdx > 0) {
      setStepIdx((i) => i - 1);
      return true;
    }
    return false;
  }, [readyToDrill, stepIdx]);

  const goBackRef = useRef(goBack);
  useEffect(() => {
    goBackRef.current = goBack;
  }, [goBack]);
  useEffect(() => {
    if (!registerBack) return;
    registerBack(() => goBackRef.current());
    return () => registerBack(null);
  }, [registerBack]);

  if (batch.length === 0) {
    onComplete();
    return null;
  }

  if (readyToDrill) {
    return (
      <div className="flex flex-col items-center justify-center text-center flex-1 min-h-0 py-12 px-6 animate-spring-in">
        <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)] mb-3">
          Batch {batchIndex + 1} · Phrases {globalIndexStart + 1}–{globalIndexStart + batch.length} of {totalPhrases}
        </p>
        <h2
          className="font-display text-[color:var(--color-fox-primary)] leading-[0.95] mb-4"
          style={{ fontSize: 'clamp(2rem, 7vw, 3rem)' }}
        >
          You&apos;ve seen the breakdown
        </h2>
        <p className="text-sm text-[color:var(--text-secondary)] max-w-sm mb-8">
          Now let&apos;s lock these phrases in. The next exercises will mix
          recognising the phrase, typing it, and filling in a missing word.
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-xl bg-[color:var(--color-fox-primary)] text-white font-bold py-3 px-6 active:scale-[0.98] transition"
        >
          Drill these {batch.length} phrases →
        </button>
      </div>
    );
  }

  const step = steps[stepIdx];
  const phrase = batch[step.phraseIdx];

  if (step.sub === 'card') {
    return (
      <PhraseCard
        key={`pcard-${phrase.id}`}
        phrase={phrase}
        languageCode={languageCode}
        onContinue={advance}
      />
    );
  }

  // breakdown
  return (
    <PhraseBreakdown
      key={`pbreak-${phrase.id}`}
      phrase={phrase}
      languageCode={languageCode}
      onContinue={advance}
    />
  );
}
