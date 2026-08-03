/**
 * String normalization + Levenshtein for fuzzy answer matching.
 *
 * Used by ProductionTyping (Phase 2), Cloze (Phase 5), and the can-do
 * certification pre-check. Accent- and case-insensitive at every length, so "estas" for
 * "estás" is an exact match. Beyond that, near-misses earn credit with a
 * "close — exact spelling: X" toast, but only as far as `allowedEditsFor`
 * permits: short words must be spelled right, since spelling them is the point.
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
 * Edit tolerance scaled to how long the target is.
 *
 * A flat allowance (we used to allow 2 edits everywhere) is nonsense on short
 * words: it accepts "voice" for "noite", "quatro" for "quarto", and literally
 * any two-letter string for a two-letter target. Typos only deserve leniency
 * once there is enough word for a typo to be a small fraction of it.
 *
 *   ≤4 chars  → 0 (exact only; accents and case are still ignored)
 *   5–7 chars → 1
 *   ≥8 chars  → len/4, capped at 5 (phrases and sentences)
 */
export function allowedEditsFor(target: string): number {
  const len = normalizeForCompare(target).length;
  if (len <= 4) return 0;
  if (len <= 7) return 1;
  return Math.min(5, Math.floor(len / 4));
}

/**
 * Compare a typed answer to the target word with accent-insensitive
 * Levenshtein. Distance 0 → exact, ≤ allowedEdits → close (still counts as
 * correct, surfaces a "near-miss" toast for the learner), otherwise wrong.
 *
 * `allowedEdits` defaults to `allowedEditsFor(target)`. Pass 0 explicitly for
 * transcription checks (type-the-revealed-answer), where only exact counts.
 */
export function fuzzyMatchAnswer(
  typed: string,
  target: string,
  allowedEdits: number = allowedEditsFor(target),
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
