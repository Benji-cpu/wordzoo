'use client';

import { useCallback, useMemo, useState } from 'react';
import { IntroduceBatch } from '@/components/learn/IntroduceBatch';
import { DrillBlock } from '@/components/learn/DrillBlock';
import { SceneCheckpoint } from '@/components/learn/SceneCheckpoint';
import type { LearnWord } from '@/types/learn';
import type { SupportedLanguageCode } from '@/types/audio';
import type { CueType } from '@/lib/pedagogy/leitner';
import type { PedagogyFlags } from '@/lib/pedagogy/flags';

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
  /** Fired after the end-of-vocab checkpoint resolves. */
  onComplete: () => void;
}

type Phase =
  | { kind: 'intro'; batchIndex: number }
  | { kind: 'drill'; batchIndex: number }
  | { kind: 'checkpoint' };

/**
 * Pedagogy v2 vocabulary phase: batched intros (N words at a time as
 * WordCard → MnemonicCard) → DrillBlock retrieval over the same batch
 * → next batch → end-of-vocab SceneCheckpoint → onComplete.
 *
 * Renders inline inside SceneFlowClient (no shell/header of its own —
 * the parent owns those). When `flags.restructure` is off, the parent
 * renders the legacy per-word loop instead.
 */
export function VocabularyBlock({
  words,
  languageName,
  languageCode,
  flags,
  onItemAnswered,
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
      showConfidence={flags.cloze}
      onItemAnswered={recordReview}
      onComplete={advanceFromDrill}
    />
  );
}
