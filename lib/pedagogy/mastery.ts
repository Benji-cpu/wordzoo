/**
 * Pedagogy v2 mastery ladder.
 *
 *   introduced  — saw the WordCard. No retrieval evidence yet.
 *   familiar    — recognized the meaning at least once, with a delay.
 *   learning    — produced the word at least once.
 *   reviewing   — SRS interval ≥ 7d AND last review correct.
 *   mastered    — SRS interval ≥ 30d AND last review correct.
 *
 * Promotion is one-way (no "demoting back to familiar" once production has
 * been shown). A `forgot` rating on a `learning+` word resets to `learning`
 * with interval = 1, but never drops below — production knowledge is taken
 * to be partially retained even after a slip.
 */

export type MasteryStage = 'introduced' | 'familiar' | 'learning' | 'reviewing' | 'mastered';

export const MASTERY_ORDER: readonly MasteryStage[] = [
  'introduced',
  'familiar',
  'learning',
  'reviewing',
  'mastered',
];

const STAGE_RANK: Record<MasteryStage, number> = {
  introduced: 0,
  familiar: 1,
  learning: 2,
  reviewing: 3,
  mastered: 4,
};

export interface PromotionSignal {
  /** SRS rating quality (0-5). 0 = forgot. */
  quality: number;
  direction: 'recognition' | 'production';
  /**
   * Resulting SM-2 interval in days after this review. Used to gate
   * `reviewing` (≥7d) and `mastered` (≥30d) promotions.
   */
  intervalDays: number;
  /**
   * Whether enough time has elapsed since the introduce event for the
   * answer to count as a real retrieval, not a working-memory peek.
   * Phase 4's introduce-batch structurally guarantees this; the server
   * backstop checks an `introduced_at` column when present.
   */
  retrievalDelayMet: boolean;
}

export function meetsThreshold(stage: MasteryStage, target: MasteryStage): boolean {
  return STAGE_RANK[stage] >= STAGE_RANK[target];
}

export function maxStage(a: MasteryStage, b: MasteryStage): MasteryStage {
  return STAGE_RANK[a] >= STAGE_RANK[b] ? a : b;
}

/**
 * Compute the next mastery stage given the previous stage and the latest
 * review signal. Pure — does not touch any I/O.
 */
export function nextStage(prev: MasteryStage | null | undefined, signal: PromotionSignal): MasteryStage {
  const current: MasteryStage = prev ?? 'introduced';

  // A failed retrieval ("forgot") resets to `learning` but never drops
  // below the floor we've already passed. A floor of `familiar` (or above)
  // bounces to `learning`; a floor of `introduced` stays at `introduced`.
  if (signal.quality < 3) {
    if (STAGE_RANK[current] >= STAGE_RANK['learning']) return 'learning';
    return current;
  }

  // From this point on the answer was correct (q >= 3).

  // Interval-based promotions trump direction-based ones because they
  // reflect long-term retention, not modality of the latest cue.
  if (signal.intervalDays >= 30) return maxStage(current, 'mastered');
  if (signal.intervalDays >= 7) return maxStage(current, 'reviewing');

  // Direction-based promotions for short intervals (in-session or new).
  if (signal.direction === 'production') {
    return maxStage(current, 'learning');
  }

  // Recognition success. Promote to `familiar` only if the answer was
  // not freshly visible (no working-memory peek). Otherwise stay put.
  if (current === 'introduced' && signal.retrievalDelayMet) {
    return 'familiar';
  }

  return current;
}

/**
 * Convenience for the legacy `status` column. The two columns must stay in
 * lockstep but mean different things — `status` is interval-bucketed only.
 */
export function masteryToLegacyStatus(stage: MasteryStage): 'new' | 'learning' | 'reviewing' | 'mastered' {
  switch (stage) {
    case 'introduced': return 'learning';   // legacy: anything seen counts as learning
    case 'familiar':   return 'learning';
    case 'learning':   return 'learning';
    case 'reviewing':  return 'reviewing';
    case 'mastered':   return 'mastered';
  }
}

export function isLearnedForSkipGate(stage: MasteryStage | null | undefined): boolean {
  if (!stage) return false;
  return meetsThreshold(stage, 'familiar');
}
