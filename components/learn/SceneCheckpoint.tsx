'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ProductionTyping } from '@/components/learn/ProductionTyping';
import { Fox } from '@/components/mascot/Fox';
import type { LearnWord } from '@/components/learn/LearnClient';
import type { SupportedLanguageCode } from '@/types/audio';
import { fireTelemetry } from '@/lib/pedagogy/telemetry';
import { useXP, XP_AMOUNTS } from '@/lib/hooks/useXP';

interface SceneCheckpointProps {
  /** Scene words + any prior-scene due words, capped at ~10. */
  items: LearnWord[];
  languageCode?: SupportedLanguageCode;
  /** Threshold to pass on first attempt (default 0.8). */
  passThreshold?: number;
  /** Max remediation loops before marking scene needs_revisit. */
  maxRemediationLoops?: number;
  onItemAnswered?: (wordId: string, correct: boolean) => void;
  /**
   * Fired exactly once when the checkpoint terminates. `passed=true` means
   * the learner cleared the threshold (possibly after remediation).
   * `needsRevisit=true` means they exhausted remediation loops.
   */
  onComplete: (result: { passed: boolean; needsRevisit: boolean; score: number }) => void;
}

interface AttemptRecord {
  wordId: string;
  correct: boolean;
  attempts: number;
}

/**
 * Cumulative end-of-scene retrieval check. Each item is presented once in
 * production mode. Pass criteria:
 *   - First-attempt accuracy >= passThreshold (e.g. 80%) → pass immediately
 *   - Below threshold → remediation: drill the failed items, re-checkpoint
 *   - Exhausted remediation loops → mark scene needs_revisit (still passes,
 *     but flagged)
 */
export function SceneCheckpoint({
  items,
  languageCode,
  passThreshold = 0.8,
  maxRemediationLoops = 2,
  onItemAnswered,
  onComplete,
}: SceneCheckpointProps) {
  // Active queue is "items the learner still needs to retrieve this round."
  const [activeIds, setActiveIds] = useState<string[]>(() => items.map((i) => i.word.id));
  const [cursor, setCursor] = useState(0);
  const [results, setResults] = useState<AttemptRecord[]>([]);
  const [phase, setPhase] = useState<'drill' | 'review' | 'done'>('drill');
  const [remediationLoops, setRemediationLoops] = useState(0);
  const totalRef = useRef(items.length);
  const startedRef = useRef(false);
  const { award } = useXP();

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    fireTelemetry({ event: 'checkpoint_started', payload: { itemCount: items.length } });
  }, [items.length]);

  const wordById = useMemo(() => {
    const map = new Map<string, LearnWord>();
    for (const w of items) map.set(w.word.id, w);
    return map;
  }, [items]);

  const finishRound = useCallback(
    (roundResults: AttemptRecord[]) => {
      const firstAttemptCorrect = roundResults.filter((r) => r.correct && r.attempts === 1).length;
      const score = firstAttemptCorrect / Math.max(1, roundResults.length);
      const failed = roundResults.filter((r) => !r.correct);

      if (score >= passThreshold && failed.length === 0) {
        // Clean pass.
        setPhase('done');
        fireTelemetry({
          event: 'checkpoint_passed',
          payload: { score, remediationLoops, itemCount: totalRef.current },
        });
        void award('checkpoint_passed');
        onComplete({ passed: true, needsRevisit: false, score });
        return;
      }

      if (failed.length === 0) {
        // No failed items but score below threshold (e.g. all correct on
        // 2nd attempt). Treat as pass with no remediation needed.
        setPhase('done');
        fireTelemetry({
          event: 'checkpoint_passed',
          payload: { score, remediationLoops, itemCount: totalRef.current },
        });
        void award('checkpoint_passed');
        onComplete({ passed: true, needsRevisit: false, score });
        return;
      }

      if (remediationLoops >= maxRemediationLoops) {
        // Exhausted — mark needs_revisit, let learner continue.
        setPhase('done');
        fireTelemetry({
          event: 'checkpoint_failed',
          payload: { score, remediationLoops, itemCount: totalRef.current },
        });
        onComplete({ passed: true, needsRevisit: true, score });
        return;
      }

      // Remediation loop: drill the failed items again.
      fireTelemetry({
        event: 'remediation_loop_started',
        payload: { failedCount: failed.length, loop: remediationLoops + 1 },
      });
      setRemediationLoops((n) => n + 1);
      setActiveIds(failed.map((f) => f.wordId));
      setCursor(0);
      setResults([]);
      setPhase('drill');
    },
    [passThreshold, remediationLoops, maxRemediationLoops, award, onComplete],
  );

  const handleCorrect = useCallback(() => {
    const wordId = activeIds[cursor];
    if (!wordId) return;
    onItemAnswered?.(wordId, true);
    const record: AttemptRecord = {
      wordId,
      correct: true,
      attempts: 1, // production component handles internal retries; we count first-pass success
    };
    const nextResults = [...results, record];
    if (cursor + 1 >= activeIds.length) {
      finishRound(nextResults);
      return;
    }
    setResults(nextResults);
    setCursor((c) => c + 1);
  }, [activeIds, cursor, results, onItemAnswered, finishRound]);

  const handleAnswer = useCallback(
    (correct: boolean, attempts: number) => {
      // Production component fires this on every attempt. We only care about
      // the FINAL outcome of the item, which arrives via onCorrect. But we
      // do mark wrong-on-second-attempt as a "failed" item so it goes into
      // remediation even though the component will eventually call onCorrect
      // once the answer is typed.
      if (!correct && attempts === 2) {
        const wordId = activeIds[cursor];
        if (!wordId) return;
        onItemAnswered?.(wordId, false);
        const record: AttemptRecord = { wordId, correct: false, attempts };
        const nextResults = [...results, record];
        // Don't advance — the component is showing the reveal-and-type
        // dismiss state. When the user types the answer, onCorrect fires
        // and we'd append a duplicate. So intercept by replacing.
        setResults(nextResults);
        // Wait for onCorrect (typing-the-answer) to advance cursor — but
        // we've already recorded this as a fail. The cursor advance in
        // handleCorrect will be a no-op-on-double if we guard there.
        // Simpler: advance now and treat onCorrect as a no-op for this item.
        if (cursor + 1 >= activeIds.length) {
          finishRound(nextResults);
        } else {
          setCursor((c) => c + 1);
        }
      }
    },
    [activeIds, cursor, results, onItemAnswered, finishRound],
  );

  if (phase === 'done') {
    return null;
  }

  const wordId = activeIds[cursor];
  const word = wordId ? wordById.get(wordId) : null;
  if (!word) return null;

  const totalThisRound = activeIds.length;
  const isRemediation = remediationLoops > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="text-center mb-3">
        <p className="text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-[color:var(--text-secondary)]">
          {isRemediation ? `Remediation ${remediationLoops}/${maxRemediationLoops}` : 'Checkpoint'} · {cursor + 1}/{totalThisRound}
        </p>
        {!isRemediation ? (
          <p className="text-xs text-[color:var(--text-secondary)] mt-1">
            Final retrieval check — type each one to lock it in <span aria-hidden>·</span> +{XP_AMOUNTS.checkpoint_passed} XP on pass
          </p>
        ) : (
          <div className="mt-2 flex items-center justify-center gap-2">
            <Fox pose="thinking" size="sm" aria-hidden />
            <p className="text-xs text-[color:var(--text-secondary)]">
              Quick recap of what tripped you up
            </p>
          </div>
        )}
      </div>
      <ProductionTyping
        key={`cp-${wordId}-${remediationLoops}-${cursor}`}
        promptEn={word.word.meaning_en}
        correctTarget={word.word.text}
        targetLanguageCode={languageCode}
        wordId={word.word.id}
        audioUrl={word.word.pronunciation_audio_url}
        onCorrect={handleCorrect}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
