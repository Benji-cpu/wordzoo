/**
 * Cloze helpers: find the target word inside a sentence as a WHOLE word and
 * blank exactly that. Plain `indexOf` used to blank "eu" inside "seu" and left
 * the learner graded on a word that was never hidden (digest: cloze 0/26).
 *
 * Matching is literal: whole tokens, case-insensitive, accents significant
 * (é is not e). A target that isn't literally in the sentence returns null and
 * the caller picks another cue instead of showing a blank-less sentence.
 */

// Letters, combining marks and digits. Apostrophes and hyphens are token
// boundaries, so "eau" is found in "l'eau" and "diga" in "diga-me".
const TOKEN_RE = /[\p{L}\p{M}\p{N}]+/gu;
// What may sit between the words of a multi-word target: spaces, hyphen or
// apostrophe only. A comma or full stop means the words are not contiguous.
const JOINER_RE = /^[\s'’‑-]+$/u;

interface Token {
  start: number;
  end: number;
  key: string;
}

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    out.push({
      start: m.index,
      end: m.index + m[0].length,
      key: m[0].normalize('NFC').toLowerCase(),
    });
  }
  return out;
}

/** Number of words in `text` (a multi-word target counts each). */
export function clozeTokenCount(text: string): number {
  return tokenize(text).length;
}

export function findClozeSpan(
  sentence: string,
  target: string,
): { start: number; end: number } | null {
  const want = tokenize(target);
  if (want.length === 0) return null;
  const have = tokenize(sentence);

  for (let i = 0; i + want.length <= have.length; i++) {
    let ok = true;
    for (let j = 0; j < want.length; j++) {
      if (have[i + j].key !== want[j].key) {
        ok = false;
        break;
      }
      if (j > 0 && !JOINER_RE.test(sentence.slice(have[i + j - 1].end, have[i + j].start))) {
        ok = false;
        break;
      }
    }
    if (ok) return { start: have[i].start, end: have[i + want.length - 1].end };
  }
  return null;
}

/**
 * Split `sentence` around the target. `answer` is the surface form as written
 * in the sentence (conjugated, capitalised), i.e. what the blank actually hides.
 */
export function blankSentence(
  sentence: string,
  target: string,
): { before: string; after: string; answer: string } | null {
  const span = findClozeSpan(sentence, target);
  if (!span) return null;
  return {
    before: sentence.slice(0, span.start),
    after: sentence.slice(span.end),
    answer: sentence.slice(span.start, span.end),
  };
}

/**
 * The phrases in which `target` (or the phrase's own `word_text`) can really be
 * blanked. Drives cloze eligibility so a cue is only offered when it can render.
 */
export function usableClozePhrases<T extends { text_target: string; word_text: string }>(
  phrases: readonly T[],
  target: string,
): T[] {
  return phrases.filter(
    (p) => findClozeSpan(p.text_target, p.word_text) || findClozeSpan(p.text_target, target),
  );
}
