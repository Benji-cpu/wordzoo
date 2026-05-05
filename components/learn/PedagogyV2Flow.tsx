'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { SceneHeader } from '@/components/learn/SceneHeader';
import { SceneShell } from '@/components/learn/SceneShell';
import { SceneSummary } from '@/components/learn/SceneSummary';
import { IntroduceBatch } from '@/components/learn/IntroduceBatch';
import { DrillBlock } from '@/components/learn/DrillBlock';
import { SceneCheckpoint } from '@/components/learn/SceneCheckpoint';
import type { LearnWord } from '@/components/learn/LearnClient';
import type { SupportedLanguageCode } from '@/types/audio';
import type { CueType } from '@/lib/pedagogy/leitner';
import type { PedagogyFlags } from '@/lib/pedagogy/flags';

const BATCH_SIZE = 3;

interface PedagogyV2FlowProps {
  sceneId: string;
  sceneTitle: string;
  sceneDescription: string | null;
  languageName: string;
  languageCode?: SupportedLanguageCode;
  words: LearnWord[];
  nextScene: { id: string; title: string; description?: string | null } | null;
  pathId?: string;
  sceneNumber?: number;
  totalScenes?: number;
  flags: PedagogyFlags;
}

type Phase =
  | { kind: 'intro'; batchIndex: number }
  | { kind: 'drill'; batchIndex: number }
  | { kind: 'checkpoint' }
  | { kind: 'complete' };

/**
 * Pedagogy v2 orchestrator: introduce-batch → drill-block → next-batch →
 * scene-checkpoint → summary. Lives behind the `restructure` flag and is
 * dark-launched alongside the legacy LearnClient flow.
 */
export function PedagogyV2Flow({
  sceneId,
  sceneTitle,
  sceneDescription,
  languageName,
  languageCode,
  words,
  nextScene,
  pathId,
  sceneNumber,
  totalScenes,
  flags,
}: PedagogyV2FlowProps) {
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
      : { kind: 'complete' },
  );
  const blockedMessageRef = useRef<string | null>(null);

  const enabledCueTypes = useMemo<CueType[]>(() => {
    const out: CueType[] = ['recognition'];
    if (flags.production) out.push('production');
    if (flags.cloze) out.push('cloze');
    return out;
  }, [flags.production, flags.cloze]);

  const recordReview = useCallback(
    (wordId: string, cueType: CueType, correct: boolean, confidence?: 'knew_it' | 'guessed') => {
      // Bridge drill answers back into the SRS engine. Mirrors the legacy
      // LearnClient behavior so the global review queue stays accurate.
      // 'guessed' downgrades a correct answer to 'hard' so the next interval
      // is shorter; explicit wrongs are 'forgot'.
      let rating: 'got_it' | 'hard' | 'forgot';
      if (!correct) rating = 'forgot';
      else if (confidence === 'guessed') rating = 'hard';
      else rating = 'got_it';

      const direction =
        cueType === 'production' || cueType === 'cloze' ? 'production' : 'recognition';

      fetch('/api/reviews/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, direction, rating }),
      }).catch(() => {});
    },
    [],
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

  const advanceFromCheckpoint = useCallback(() => {
    setPhase({ kind: 'complete' });
  }, []);

  if (phase.kind === 'complete' || words.length === 0) {
    return (
      <SceneShell className="max-w-lg mx-auto">
        <SceneSummary
          sceneTitle={sceneTitle}
          sceneDescription={sceneDescription}
          words={words}
          nextScene={nextScene}
          pathId={pathId}
          sceneNumber={sceneNumber}
          totalScenes={totalScenes}
        />
      </SceneShell>
    );
  }

  if (phase.kind === 'checkpoint') {
    return (
      <SceneShell
        top={
          <SceneHeader
            title={sceneTitle}
            current={words.length}
            total={words.length}
          />
        }
        className="max-w-lg mx-auto"
      >
        <SceneCheckpoint
          items={words}
          languageCode={languageCode}
          onItemAnswered={(wordId, correct) => {
            recordReview(wordId, 'production', correct);
          }}
          onComplete={advanceFromCheckpoint}
        />
      </SceneShell>
    );
  }

  const batch = batches[phase.batchIndex];
  const globalIndexStart = phase.batchIndex * BATCH_SIZE;

  if (phase.kind === 'intro') {
    return (
      <SceneShell
        top={
          <SceneHeader
            title={sceneTitle}
            current={Math.min(globalIndexStart + 1, words.length)}
            total={words.length}
          />
        }
        className="max-w-lg mx-auto"
      >
        <IntroduceBatch
          key={`intro-${phase.batchIndex}`}
          words={batch}
          batchIndex={phase.batchIndex}
          globalIndexStart={globalIndexStart}
          totalWords={words.length}
          languageName={languageName}
          languageCode={languageCode}
          recordIntroduce={flags.mastery}
          onIntroduceBlocked={(msg) => {
            blockedMessageRef.current = msg;
          }}
          onComplete={advanceFromIntro}
        />
      </SceneShell>
    );
  }

  // phase.kind === 'drill'
  return (
    <SceneShell
      top={
        <SceneHeader
          title={sceneTitle}
          current={Math.min(globalIndexStart + batch.length, words.length)}
          total={words.length}
        />
      }
      className="max-w-lg mx-auto"
    >
      <DrillBlock
        key={`drill-${phase.batchIndex}`}
        words={batch}
        languageCode={languageCode}
        enabledCueTypes={enabledCueTypes}
        showConfidence={flags.cloze}
        onItemAnswered={recordReview}
        onComplete={advanceFromDrill}
      />
    </SceneShell>
  );
}
