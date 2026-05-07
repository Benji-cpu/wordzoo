'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PhraseCard } from '@/components/learn/PhraseCard';
import { PhraseBreakdown } from '@/components/learn/PhraseBreakdown';
import { PhraseDrillBlock } from '@/components/learn/PhraseDrillBlock';
import { PhraseCheckpoint } from '@/components/learn/PhraseCheckpoint';
import type { ScenePhraseWithMnemonics } from '@/types/database';
import type { SupportedLanguageCode } from '@/types/audio';
import type { CueType, DrillQueue } from '@/lib/pedagogy/leitner';
import type { PedagogyFlags } from '@/lib/pedagogy/flags';
import type { V2BlockProgress } from '@/components/learn/v2-progress';

const BATCH_SIZE = 2;

interface PhraseBlockProps {
  phrases: ScenePhraseWithMnemonics[];
  languageCode?: SupportedLanguageCode;
  flags: PedagogyFlags;
  /** Bridges drill answers back to /api/reviews/record-phrase. */
  onItemAnswered?: (phraseId: string, correct: boolean) => void;
  /** Fired on every internal state change so the parent can drive its
   * progress bar + intercept the back button. */
  onProgress?: (progress: V2BlockProgress) => void;
  /** Fired after the end-of-phrases checkpoint resolves. */
  onComplete: () => void;
}

type IntroStep = { phraseIdx: number; sub: 'card' | 'breakdown' };
type Phase =
  | { kind: 'intro'; batchIndex: number }
  | { kind: 'drill'; batchIndex: number }
  | { kind: 'checkpoint' };

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
 *   PhraseCheckpoint over every phrase in the scene → onComplete
 */
export function PhraseBlock({
  phrases,
  languageCode,
  flags,
  onItemAnswered,
  onProgress,
  onComplete,
}: PhraseBlockProps) {
  const batches = useMemo(() => {
    const out: ScenePhraseWithMnemonics[][] = [];
    for (let i = 0; i < phrases.length; i += BATCH_SIZE) {
      out.push(phrases.slice(i, i + BATCH_SIZE));
    }
    return out;
  }, [phrases]);

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
    if (phase.batchIndex > 0) {
      setPhase({ kind: 'drill', batchIndex: phase.batchIndex - 1 });
      return true;
    }
    return false;
  }, [phase, batches.length]);

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
      fraction = (phase.batchIndex * 2 + 1 + drillFraction) / totalSlots;
    }
    onProgress({
      fraction: Math.max(0, Math.min(1, fraction)),
      goBack: () => goBackRef.current(),
    });
  }, [phase, drillFraction, totalSlots, onProgress]);

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
        onComplete={onComplete}
      />
    );
  }

  const batch = batches[phase.batchIndex];

  if (phase.kind === 'intro') {
    return (
      <PhraseIntroBatch
        key={`intro-${phase.batchIndex}`}
        batchIndex={phase.batchIndex}
        batch={batch}
        totalPhrases={phrases.length}
        globalIndexStart={phase.batchIndex * BATCH_SIZE}
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
  onComplete: () => void;
}

function PhraseIntroBatch({
  batchIndex,
  batch,
  totalPhrases,
  globalIndexStart,
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

  const [stepIdx, setStepIdx] = useState(0);
  const [readyToDrill, setReadyToDrill] = useState(false);

  const advance = useCallback(() => {
    if (stepIdx + 1 >= steps.length) {
      setReadyToDrill(true);
      return;
    }
    setStepIdx((i) => i + 1);
  }, [stepIdx, steps.length]);

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
        onContinue={advance}
      />
    );
  }

  // breakdown
  return (
    <PhraseBreakdown
      key={`pbreak-${phrase.id}`}
      phrase={phrase}
      onContinue={advance}
    />
  );
}
