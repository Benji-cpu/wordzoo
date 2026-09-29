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

/**
 * `normalizeForCompare` plus punctuation and spacing: "Tudo bem, obrigado!"
 * and "tudo bem obrigado" compare equal. For whole sentences, where a missing
 * comma is not a mistake worth marking.
 */
export function normalizeSentence(value: string): string {
  return normalizeForCompare(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Word by word, each word with its own `allowedEditsFor` budget. A whole-string
 * budget (length/4) is generous enough on a short sentence to accept a
 * different word — "vamos cantar" for "vamos nadar" is 3 edits of a 12-char
 * target — so a typo is judged against the word it is in, and a missing,
 * extra or swapped word is a different answer. Spacing alone ("bemvindo") is
 * not a mistake.
 */
function sentenceMatches(typed: string, answer: string): boolean {
  if (typed === answer) return true;
  if (typed.replace(/ /g, '') === answer.replace(/ /g, '')) return true;
  const typedWords = typed.split(' ');
  const answerWords = answer.split(' ');
  if (typedWords.length !== answerWords.length) return false;
  return answerWords.every((word, i) => levenshtein(typedWords[i], word) <= allowedEditsFor(word));
}

/**
 * Match a typed sentence against every answer that counts as right,
 * forgiving accents, case, punctuation and per-word typos
 * (`sentenceMatches`). Returns the answer it matched, or null.
 *
 * This is how conversation practice is graded: the authored turn carries its
 * accepted answers, so no model is asked (the Gemini grader it replaced was
 * deleted on 2026-09-29).
 */
export function matchAnyAnswer(typed: string, answers: readonly string[]): string | null {
  const t = normalizeSentence(typed);
  if (!t) return null;
  for (const answer of answers) {
    const a = normalizeSentence(answer);
    if (a && sentenceMatches(t, a)) return answer;
  }
  return null;
}

export interface RecallScore {
  /** Share of the best target's words that were said, 0-1. */
  ratio: number;
  verdict: 'correct' | 'partial' | 'wrong';
  /** Target words heard, in the target's own casing and accents. */
  matched: string[];
  /** Target words not heard, in target order. */
  missed: string[];
  /** The accepted answer the attempt was judged against. */
  bestTarget: string;
  /** The attempt that scored best, as typed or transcribed. */
  heard: string;
}

interface Word {
  display: string;
  norm: string;
}

function wordsOf(value: string): Word[] {
  return value
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((display) => ({ display, norm: normalizeForCompare(display) }))
    .filter((w) => w.norm.length > 0);
}

function wordMatches(said: string, target: string): boolean {
  return said === target || levenshtein(said, target) <= allowedEditsFor(target);
}

/** Longest in-order run of target words that the attempt also said. */
function alignWords(target: Word[], attempt: Word[]): boolean[] {
  const n = target.length;
  const m = attempt.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = wordMatches(attempt[j - 1].norm, target[i - 1].norm)
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const hit = new Array<boolean>(n).fill(false);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (wordMatches(attempt[j - 1].norm, target[i - 1].norm) && dp[i][j] === dp[i - 1][j - 1] + 1) {
      hit[i - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return hit;
}

/**
 * Grade a typed or spoken recall against every accepted answer.
 *
 * `attempts` is one string when typed, or the recogniser's alternatives
 * best-first; the best (target, attempt) pair decides. A single word or short
 * phrase is all-or-nothing, since a half-said word is not half-known. A longer
 * phrase earns partial credit and reports which words were missed, so the
 * learner sees what to fix rather than a bare "wrong".
 */
export function scoreRecall(
  targets: string[],
  attempts: string[],
  opts: { kind?: 'word' | 'phrase' } = {},
): RecallScore {
  const accepted = targets.filter((t) => wordsOf(t).length > 0);
  const canonical = accepted[0] ?? targets[0] ?? '';
  const kind = opts.kind ?? (wordsOf(canonical).length <= 2 ? 'word' : 'phrase');

  let best: { rank: number; score: RecallScore } | null = null;

  for (const attempt of attempts) {
    const said = wordsOf(attempt);
    if (said.length === 0) continue;
    for (const target of accepted) {
      const tWords = wordsOf(target);
      const exact = matchAnyAnswer(attempt, [target]) !== null;
      const hit = exact ? tWords.map(() => true) : alignWords(tWords, said);
      const matchedCount = hit.filter(Boolean).length;
      const ratio = matchedCount / tWords.length;
      // Exact beats any fuzzy alignment; earlier attempt / target win ties.
      const rank = exact ? 2 : ratio;
      if (best && rank <= best.rank) continue;

      let verdict: RecallScore['verdict'];
      if (exact) {
        verdict = 'correct';
      } else if (kind === 'word') {
        verdict = 'wrong';
      } else {
        verdict = ratio >= 0.9 ? 'correct' : ratio >= 0.6 ? 'partial' : 'wrong';
      }
      const extras = said.length - matchedCount;
      if (verdict === 'correct' && !exact && extras > Math.max(2, Math.ceil(tWords.length / 2))) {
        verdict = 'partial';
      }
      const wordKindMiss = kind === 'word' && verdict === 'wrong';
      best = {
        rank,
        score: {
          ratio: wordKindMiss ? 0 : ratio,
          verdict,
          matched: wordKindMiss ? [] : tWords.filter((_, i) => hit[i]).map((w) => w.display),
          missed: wordKindMiss
            ? tWords.map((w) => w.display)
            : tWords.filter((_, i) => !hit[i]).map((w) => w.display),
          bestTarget: target,
          heard: attempt.trim(),
        },
      };
    }
  }

  if (!best) {
    return {
      ratio: 0,
      verdict: 'wrong',
      matched: [],
      missed: wordsOf(canonical).map((w) => w.display),
      bestTarget: canonical,
      heard: attempts.map((a) => a.trim()).find(Boolean) ?? '',
    };
  }
  return best.score;
}
