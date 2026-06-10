/**
 * XP level curve. Quadratic: each level costs 50 more XP than the last,
 * so the cumulative threshold for level n is 50 · n(n−1)/2:
 *
 *   L1 → 0, L2 → 100, L3 → 250, L4 → 450, L5 → 700, L10 → 2,250 …
 *
 * Sized against XP_AMOUNTS (lib/hooks/useXP.ts): a completed scene with
 * drills earns roughly 60–100 XP, so early levels land every 1–2 sessions
 * and later ones stretch out.
 *
 * DO NOT change this formula casually — existing users' displayed levels
 * are derived from it, and a new curve silently relabels everyone.
 */

export interface LevelInfo {
  level: number;
  /** XP earned within the current level. */
  intoLevel: number;
  /** XP still needed to reach the next level. */
  toNext: number;
  /** 0–1 progress through the current level. */
  progress: number;
}

const STEP = 50;

/** Total XP required to reach level n (level 1 = 0 XP). */
export function xpForLevel(n: number): number {
  if (n <= 1) return 0;
  return (STEP * n * (n - 1)) / 2;
}

export function levelFromXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor;
  const intoLevel = xp - floor;
  return {
    level,
    intoLevel,
    toNext: ceil - xp,
    progress: span > 0 ? intoLevel / span : 0,
  };
}
