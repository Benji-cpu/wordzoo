'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PhraseQuiz } from '@/components/learn/PhraseQuiz';
import { Fox } from '@/components/mascot/Fox';
import { useXP, XP_AMOUNTS } from '@/lib/hooks/useXP';
import { fireTelemetry } from '@/lib/pedagogy/telemetry';
import { buildPhraseDistractors } from '@/lib/learn/phrase-distractors';
import type { ScenePhraseWithMnemonics } from '@/types/database';

interface PhraseCheckpointProps {
  /** Phrases to retrieve cumulatively (capped externally — pass scene's phrases). */
  items: ScenePhraseWithMnemonics[];
  /** All phrases in the scene — used for MCQ distractors (usually same as items). */
  scenePhrases: ScenePhraseWithMnemonics[];
  passThreshold?: number;
  maxRemediationLoops?: number;
  onItemAnswered?: (phraseId: string, correct: boolean) => void;
  onComplete: (result: { passed: boolean; needsRevisit: boolean; score: number }) => void;
}

interface AttemptRecord {
  phraseId: string;
  correct: boolean;
}

/**
 * End-of-phrases retrieval check (parallel to SceneCheckpoint for words).
 * Each item presented once via recognition MCQ. Pass criteria:
 *   - First-attempt accuracy ≥ passThreshold (default 0.8) → pass
 *   - Below threshold → remediation: drill failed items, re-checkpoint
 *   - Exhausted remediation → flag needs_revisit (still passes the
 *     gate, but the parent can mark the phase as needing review later)
 *
 * Uses recognition (MCQ) rather than production typing because phrases
 * are too long for a final retrieval typing test — the bar here is
 * "do you recognise this?", not "can you reproduce it from scratch?".
 */
export function PhraseCheckpoint({
  items,
  scenePhrases,
  passThreshold = 0.8,
  maxRemediationLoops = 2,
  onItemAnswered,
  onComplete,
}: PhraseCheckpointProps) {
  const [activeIds, setActiveIds] = useState<string[]>(() => items.map((i) => i.id));
  const [cursor, setCursor] = useState(0);
  const [results, setResults] = useState<AttemptRecord[]>([]);
  const [phase, setPhase] = useState<'drill' | 'done'>('drill');
  const [remediationLoops, setRemediationLoops] = useState(0);
  const totalRef = useRef(items.length);
  const startedRef = useRef(false);
  const { award } = useXP();

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    fireTelemetry({ event: 'phrase_checkpoint_started', payload: { itemCount: items.length } });
  }, [items.length]);

  const phraseById = useMemo(() => {
    const map = new Map<string, ScenePhraseWithMnemonics>();
    for (const p of items) map.set(p.id, p);
    return map;
  }, [items]);

  const finishRound = useCallback(
    (roundResults: AttemptRecord[]) => {
      const correctCount = roundResults.filter((r) => r.correct).length;
      const score = correctCount / Math.max(1, roundResults.length);
      const failed = roundResults.filter((r) => !r.correct);

      if (score >= passThreshold && failed.length === 0) {
        setPhase('done');
        fireTelemetry({
          event: 'phrase_checkpoint_passed',
          payload: { score, remediationLoops, itemCount: totalRef.current },
        });
        void award('phrase_checkpoint_passed');
        onComplete({ passed: true, needsRevisit: false, score });
        return;
      }

      if (failed.length === 0) {
        setPhase('done');
        fireTelemetry({
          event: 'phrase_checkpoint_passed',
          payload: { score, remediationLoops, itemCount: totalRef.current },
        });
        void award('phrase_checkpoint_passed');
        onComplete({ passed: true, needsRevisit: false, score });
        return;
      }

      if (remediationLoops >= maxRemediationLoops) {
        setPhase('done');
        fireTelemetry({
          event: 'phrase_checkpoint_failed',
          payload: { score, remediationLoops, itemCount: totalRef.current },
        });
        onComplete({ passed: true, needsRevisit: true, score });
        return;
      }

      // Remediation: re-drill failed items.
      fireTelemetry({
        event: 'phrase_remediation_loop_started',
        payload: { failedCount: failed.length, loop: remediationLoops + 1 },
      });
      setRemediationLoops((n) => n + 1);
      setActiveIds(failed.map((f) => f.phraseId));
      setCursor(0);
      setResults([]);
      setPhase('drill');
    },
    [passThreshold, remediationLoops, maxRemediationLoops, award, onComplete],
  );

  // We capture the result via `onAnswer` (PhraseQuiz fires this on every
  // selection, before the auto-reveal). `onCorrect` then advances cursor.
  const lastAnswerRef = useRef<{ correct: boolean | null }>({ correct: null });

  const handleAnswer = useCallback((correct: boolean) => {
    lastAnswerRef.current = { correct };
  }, []);

  const handleAdvance = useCallback(() => {
    const phraseId = activeIds[cursor];
    if (!phraseId) return;
    const correct = lastAnswerRef.current.correct ?? true;
    lastAnswerRef.current = { correct: null };
    onItemAnswered?.(phraseId, correct);
    const record: AttemptRecord = { phraseId, correct };
    const nextResults = [...results, record];
    if (cursor + 1 >= activeIds.length) {
      finishRound(nextResults);
      return;
    }
    setResults(nextResults);
    setCursor((c) => c + 1);
  }, [activeIds, cursor, results, onItemAnswered, finishRound]);

  if (phase === 'done') {
    return null;
  }

  const phraseId = activeIds[cursor];
  const phrase = phraseId ? phraseById.get(phraseId) : null;
  if (!phrase) return null;

  const totalThisRound = activeIds.length;
  const isRemediation = remediationLoops > 0;
  const distractors = buildPhraseDistractors(scenePhrases, phrase.text_target, 3);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="text-center mb-3">
        <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)]">
          {isRemediation ? `Remediation ${remediationLoops}/${maxRemediationLoops}` : 'Phrase checkpoint'} · {cursor + 1}/{totalThisRound}
        </p>
        {!isRemediation ? (
          <p className="text-xs text-[color:var(--text-secondary)] mt-1">
            Quick recall check — recognise each phrase
            {' '}<span aria-hidden>·</span>{' '}
            +{XP_AMOUNTS.phrase_checkpoint_passed} XP on pass
          </p>
        ) : (
          <div className="mt-2 flex items-center justify-center gap-2">
            <Fox pose="thinking" size="sm" aria-hidden />
            <p className="text-xs text-[color:var(--text-secondary)]">
              Quick recap of the phrases that tripped you up
            </p>
          </div>
        )}
      </div>
      <PhraseQuiz
        key={`pcp-${phraseId}-${remediationLoops}-${cursor}`}
        promptText={phrase.text_en}
        correctAnswer={phrase.text_target}
        distractors={distractors}
        onCorrect={handleAdvance}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
