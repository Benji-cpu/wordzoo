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
  /** Share of the counted target words that were said, 0-1. */
  ratio: number;
  verdict: 'correct' | 'partial' | 'wrong';
  /** Counted target words heard, in the target's own casing and accents. */
  matched: string[];
  /** Counted target words not heard, in target order. */
  missed: string[];
  /** How many target words counted (content words only in content-word mode). */
  total: number;
  /** The accepted answer the attempt was judged against. */
  bestTarget: string;
  /** The attempt that scored best, as typed or transcribed. */
  heard: string;
  /** Set when the attempt was right only via the other gender ending (obrigado/obrigada). */
  variant?: 'gender';
}

export interface RecallOptions {
  kind?: 'word' | 'phrase';
  /**
   * Phrase scoring on content words: function words and names are shown but
   * not required. All content words is correct; at least half (of a phrase
   * with three or more) is partial; anything less is wrong.
   */
  contentWords?: boolean;
  /** Extra names (e.g. the learner's own) that are never required. */
  names?: string[];
  /**
   * The attempt came from a recogniser. Short words (2-3 letters) then allow
   * one edit, because a recogniser mishears "sim" as "sem" far more often than
   * a learner misspells it.
   */
  spoken?: boolean;
  /** Normalised gender flips that are a different word ("caso" for "casa"). */
  noVariants?: string[];
}

interface Word {
  display: string;
  norm: string;
  /** Char offset in the number-normalised text, for the capital-letter test. */
  start: number;
}

const NUMBER_UNITS = [
  'zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
  'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove',
];
const NUMBER_TENS: Record<number, string> = {
  2: 'vinte', 3: 'trinta', 4: 'quarenta', 5: 'cinquenta', 6: 'sessenta', 7: 'setenta', 8: 'oitenta', 9: 'noventa',
};

/** 0-100 in Portuguese words, or null outside that range. */
export function numberToPortuguese(n: number): string | null {
  if (!Number.isInteger(n) || n < 0 || n > 100) return null;
  if (n < 20) return NUMBER_UNITS[n];
  if (n === 100) return 'cem';
  const tens = NUMBER_TENS[Math.floor(n / 10)];
  return n % 10 === 0 ? tens : `${tens} e ${NUMBER_UNITS[n % 10]}`;
}

/**
 * A recogniser writes "R$ 5" or "5 reais" for "cinco reais"; the target is in
 * words. Turn digits (0-100) and "R$ N" into Portuguese words on both sides so
 * they compare equal. Anything larger or fractional is left alone.
 */
export function normalizeNumbers(value: string): string {
  return value
    .replace(/R\$\s*(\d{1,3})(?![\p{L}\p{N}])/gu, (m, d: string) => {
      const words = numberToPortuguese(Number(d));
      if (!words) return m;
      return Number(d) === 1 ? 'um real' : `${words} reais`;
    })
    .replace(/(?<![\p{L}\p{N}])(\d{1,3})(?![\p{L}\p{N}])/gu, (m, d: string) => numberToPortuguese(Number(d)) ?? m);
}

function tokensOf(value: string): Word[] {
  const text = normalizeNumbers(value);
  const out: Word[] = [];
  for (const m of text.matchAll(/[\p{L}\p{N}]+/gu)) {
    const norm = normalizeForCompare(m[0]);
    if (norm.length > 0) out.push({ display: m[0], norm, start: m.index });
  }
  return out;
}

const wordsOf = tokensOf;

/** Portuguese function words, accent-stripped: shown in a phrase, never required. */
const FUNCTION_WORDS = new Set([
  'a', 'o', 'as', 'os', 'ao', 'aos', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'e', 'um', 'uma', 'uns', 'umas', 'que', 'para', 'pra', 'por', 'pelo', 'pela', 'com', 'se', 'me',
  'te', 'lhe', 'mas', 'ou',
]);

function isCapitalised(display: string): boolean {
  const first = display[0];
  return first !== first.toLowerCase() && first === first.toUpperCase();
}

/** Indexes of the target words a learner must say: not function words, not names. */
function requiredIndexes(target: string, tokens: Word[], names: string[]): number[] {
  const text = normalizeNumbers(target);
  const known = new Set(names.flatMap((n) => wordsOf(n).map((w) => w.norm)));
  const required: number[] = [];
  tokens.forEach((t, i) => {
    if (FUNCTION_WORDS.has(t.norm) || known.has(t.norm)) return;
    // A capital that is not the start of a sentence marks a name (Ana, Brasil).
    const before = text.slice(0, t.start).replace(/[\s"'“”‘’(¿¡[]+$/u, '');
    const sentenceStart = before === '' || /[.!?…]$/.test(before);
    if (isCapitalised(t.display) && !sentenceStart) return;
    required.push(i);
  });
  // A phrase made only of function words ("É o que?") still has to be scored.
  return required.length > 0 ? required : tokens.map((_, i) => i);
}

/** 0-1 closeness of two sentences, accents, case and punctuation ignored. */
export function similarity(a: string, b: string): number {
  const x = normalizeSentence(a);
  const y = normalizeSentence(b);
  const longest = Math.max(x.length, y.length);
  if (longest === 0) return 0;
  return 1 - levenshtein(x, y) / longest;
}

function wordMatches(said: string, target: string, spoken: boolean): boolean {
  if (said === target) return true;
  const edits = spoken && target.length >= 2 && target.length <= 3 ? 1 : allowedEditsFor(target);
  return levenshtein(said, target) <= edits;
}

/** Longest in-order run of target words that the attempt also said. */
function alignWords(target: Word[], attempt: Word[], spoken: boolean): boolean[] {
  const n = target.length;
  const m = attempt.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = wordMatches(attempt[j - 1].norm, target[i - 1].norm, spoken)
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const hit = new Array<boolean>(n).fill(false);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (wordMatches(attempt[j - 1].norm, target[i - 1].norm, spoken) && dp[i][j] === dp[i - 1][j - 1] + 1) {
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

/** The other gender ending of a single word: obrigado <-> obrigada. */
function genderFlip(word: string): string | null {
  if (!/[oa]$/i.test(word)) return null;
  const last = word.slice(-1);
  const flipped = last === 'o' ? 'a' : last === 'a' ? 'o' : last === 'O' ? 'A' : 'O';
  return word.slice(0, -1) + flipped;
}

interface Candidate {
  text: string;
  variant: boolean;
}

/**
 * Grade a typed or spoken recall against every accepted answer.
 *
 * `attempts` is one string when typed, or the recogniser's alternatives
 * best-first; the best (target, attempt) pair decides. A single word or short
 * phrase is all-or-nothing, since a half-said word is not half-known. A longer
 * phrase earns partial credit and reports which words were missed, so the
 * learner sees what to fix rather than a bare "wrong". With `contentWords` the
 * partial band is measured on content words only (see RecallOptions).
 */
export function scoreRecall(
  targets: string[],
  attempts: string[],
  opts: RecallOptions = {},
): RecallScore {
  const accepted = targets.filter((t) => wordsOf(t).length > 0);
  const canonical = accepted[0] ?? targets[0] ?? '';
  const kind = opts.kind ?? (wordsOf(canonical).length <= 2 ? 'word' : 'phrase');
  const spoken = opts.spoken ?? false;
  const content = (opts.contentWords ?? false) && kind === 'phrase';
  const names = opts.names ?? [];

  const candidates: Candidate[] = accepted.map((text) => ({ text, variant: false }));
  if (kind === 'word') {
    // o/a endings of a single word count (obrigado/obrigada); appended last so
    // a real target wins any tie.
    const skip = new Set(opts.noVariants ?? []);
    for (const text of accepted) {
      if (wordsOf(text).length !== 1) continue;
      const flipped = genderFlip(text.trim());
      if (flipped && !skip.has(normalizeForCompare(flipped))) candidates.push({ text: flipped, variant: true });
    }
  }

  let best: { rank: number; score: RecallScore } | null = null;

  for (const attempt of attempts) {
    const said = wordsOf(attempt);
    if (said.length === 0) continue;
    const saidNorm = normalizeSentence(attempt);
    for (const cand of candidates) {
      const target = cand.text;
      const tWords = wordsOf(target);
      const counted = content ? requiredIndexes(target, tWords, names) : tWords.map((_, i) => i);
      const countedWords = counted.map((i) => tWords[i]);
      const exact = matchAnyAnswer(attempt, [target]) !== null;
      const identical = saidNorm === normalizeSentence(target);
      const hit = exact ? countedWords.map(() => true) : alignWords(countedWords, said, spoken);
      const matchedCount = hit.filter(Boolean).length;
      const ratio = matchedCount / countedWords.length;
      // Identical beats a typo-tolerant match, which beats any fuzzy alignment;
      // earlier attempt / target win ties.
      const rank = identical ? 3 : exact ? 2 : ratio;
      if (best && rank <= best.rank) continue;

      let verdict: RecallScore['verdict'];
      if (exact) {
        verdict = 'correct';
      } else if (kind === 'word') {
        verdict = ratio === 1 ? 'correct' : 'wrong';
      } else if (content) {
        verdict =
          matchedCount === countedWords.length
            ? 'correct'
            : countedWords.length >= 3 && ratio >= 0.5
              ? 'partial'
              : 'wrong';
      } else {
        verdict = ratio >= 0.9 ? 'correct' : ratio >= 0.6 ? 'partial' : 'wrong';
        const extras = said.length - matchedCount;
        if (verdict === 'correct' && extras > Math.max(2, Math.ceil(tWords.length / 2))) {
          verdict = 'partial';
        }
      }
      const wordKindMiss = kind === 'word' && verdict === 'wrong';
      best = {
        rank,
        score: {
          ratio: wordKindMiss ? 0 : ratio,
          verdict,
          matched: wordKindMiss ? [] : countedWords.filter((_, i) => hit[i]).map((w) => w.display),
          missed: wordKindMiss
            ? countedWords.map((w) => w.display)
            : countedWords.filter((_, i) => !hit[i]).map((w) => w.display),
          total: countedWords.length,
          bestTarget: target,
          heard: attempt.trim(),
          ...(cand.variant && verdict === 'correct' ? { variant: 'gender' as const } : {}),
        },
      };
    }
  }

  if (!best) {
    const words = wordsOf(canonical);
    return {
      ratio: 0,
      verdict: 'wrong',
      matched: [],
      missed: words.map((w) => w.display),
      total: words.length,
      bestTarget: canonical,
      heard: attempts.map((a) => a.trim()).find(Boolean) ?? '',
    };
  }
  return best.score;
}
