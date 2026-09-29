import type { ScenePhraseWithMnemonics, PhraseWordMnemonic } from '@/types/database';
import type { CueType, DrillItem } from '@/lib/pedagogy/leitner';
import { clozeTokenCount, findClozeSpan } from '@/lib/pedagogy/cloze';

/**
 * Pedagogy v2 — phrase-side analogue of `lib/pedagogy/exercise-picker`.
 * Decides which cue type to surface for a given phrase based on what
 * data the phrase has populated and which slices the parent enabled.
 */

export interface PhraseEligibility {
  /** At least 4 phrases exist in the scene → recognition MCQ has 3 distractors. */
  recognitionAvailable: boolean;
  /** Phrase has a >=4-char word from `phrase.words[]` that appears whole in its text. */
  clozeAvailable: boolean;
  /** Phrase has audio_url. Reserved for the listening cue (next round). */
  hasAudioUrl: boolean;
}

const MIN_CLOZE_WORD_LENGTH = 4;

/**
 * Pick a content word from the phrase to blank for cloze. Only words that
 * literally appear in `text_target` as a whole word qualify (a word from the
 * gloss list that was inflected away, or that only occurs inside another word,
 * would render a blank-less sentence). Prefers single-token words, then the
 * longest, so we don't blank out "di" / "ke". Returns null if nothing
 * qualifies (caller should use another cue).
 */
export function pickClozeWord(
  phrase: Pick<ScenePhraseWithMnemonics, 'words' | 'text_target'>,
): PhraseWordMnemonic | null {
  const eligible = phrase.words
    .filter(
      (w) =>
        w.word_text.length >= MIN_CLOZE_WORD_LENGTH &&
        findClozeSpan(phrase.text_target, w.word_text) !== null,
    )
    .sort((a, b) => {
      const multiA = clozeTokenCount(a.word_text) > 1 ? 1 : 0;
      const multiB = clozeTokenCount(b.word_text) > 1 ? 1 : 0;
      return multiA - multiB || b.word_text.length - a.word_text.length;
    });
  return eligible[0] ?? null;
}

export function computePhraseEligibility(
  phrase: ScenePhraseWithMnemonics,
  scenePhraseCount: number,
): PhraseEligibility {
  return {
    recognitionAvailable: scenePhraseCount >= 4,
    clozeAvailable: pickClozeWord(phrase) !== null,
    hasAudioUrl: !!phrase.audio_url,
  };
}

/**
 * Mirrors `lib/pedagogy/exercise-picker.eligibleCueTypes`: returns the
 * cue types that can render for this phrase given current data + flags.
 * Production typing is always available (just needs `text_target`).
 */
export function eligiblePhraseCueTypes(
  elig: PhraseEligibility,
  enabled: CueType[],
): CueType[] {
  const out: CueType[] = [];
  if (enabled.includes('recognition') && elig.recognitionAvailable) out.push('recognition');
  if (enabled.includes('production')) out.push('production');
  if (enabled.includes('cloze') && elig.clozeAvailable) out.push('cloze');
  return out;
}

/**
 * Pick the next cue type for the active item. Round-robins among types
 * the item has not yet passed, preferring recognition first (lightest)
 * then production then cloze, mirroring the vocab picker's intent.
 */
export function pickPhraseCueType(
  item: DrillItem,
  elig: PhraseEligibility,
  enabled: CueType[],
): CueType {
  const candidates = eligiblePhraseCueTypes(elig, enabled);
  if (candidates.length === 0) return 'recognition'; // defensive
  // Skip ones already passed this item.
  const remaining = candidates.filter((c) => !item.cueTypesPassed.includes(c));
  const pool = remaining.length > 0 ? remaining : candidates;
  // Deterministic round-robin: rotate by tries so the same item retries
  // through different shapes if it keeps failing.
  return pool[item.tries % pool.length];
}
