/**
 * String normalization + Levenshtein for fuzzy answer matching.
 *
 * Used by ProductionTyping (Phase 2), Cloze (Phase 5), and ListeningExercise's
 * dictation mode. Accent-insensitive so a learner typing "kofi" for "kopi" or
 * "estas" for "estás" gets credit, with a "close — exact spelling: X" toast.
 */

export function normalizeForCompare(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // deletion
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export type FuzzyMatchResult =
  | { kind: 'exact' }
  | { kind: 'close'; distance: number; canonicalAnswer: string }
  | { kind: 'wrong'; distance: number };

/**
 * Compare a typed answer to the target word with accent-insensitive
 * Levenshtein. Distance 0 → exact, ≤ allowedEdits → close (still counts as
 * correct, surfaces a "near-miss" toast for the learner), otherwise wrong.
 */
export function fuzzyMatchAnswer(
  typed: string,
  target: string,
  allowedEdits: number = 2,
): FuzzyMatchResult {
  const tNorm = normalizeForCompare(typed);
  const aNorm = normalizeForCompare(target);
  if (tNorm === aNorm) return { kind: 'exact' };
  const dist = levenshtein(tNorm, aNorm);
  if (dist <= allowedEdits) {
    return { kind: 'close', distance: dist, canonicalAnswer: target };
  }
  return { kind: 'wrong', distance: dist };
}
