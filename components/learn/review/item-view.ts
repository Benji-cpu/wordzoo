import { alternateTexts, itemKey, type SittingItem } from '@/lib/pedagogy/review-session';
import { normalizeForCompare } from '@/lib/pedagogy/normalize';
import type { DueWordForReview } from '@/lib/db/queries';
import type { DuePhraseForReview } from '@/lib/db/scene-flow-queries';
import type { LearnWordFamily } from '@/types/learn';
import type { PhraseWordMnemonic } from '@/types/database';

/** A learned word, as much of it as distractors and alternates need. */
export interface PoolWord {
  id: string;
  text: string;
  meaning_en: string;
}

export interface MnemonicView {
  imageUrl: string | null;
  keyword: string | null;
  bridge: string | null;
  description: string | null;
}

/** One sitting item as the cards see it: the same shape for words and phrases. */
export interface ItemView {
  key: string;
  kind: 'word' | 'phrase';
  id: string;
  /** The target-language form the learner is asked to produce. */
  text: string;
  /** The English gloss / translation. */
  meaning: string;
  romanization: string | null;
  audioUrl: string | null;
  literal: string | null;
  mnemonic: MnemonicView | null;
  /** Other accepted answers (words only). */
  alternates: string[];
  /** Normalised gender flips that are a different learned word (words only). */
  noVariants: string[];
  /** The words of a phrase with their own mnemonics. */
  phraseWords: PhraseWordMnemonic[];
  families: LearnWordFamily[];
}

export function wordView(
  w: DueWordForReview,
  pool: readonly PoolWord[],
  families: LearnWordFamily[] | undefined,
): ItemView {
  const own = { id: w.word_id, text: w.text, meaning_en: w.meaning_en };
  const alternates = alternateTexts(own, pool);
  if (w.informal_text && normalizeForCompare(w.informal_text) !== normalizeForCompare(w.text)) {
    alternates.push(w.informal_text);
  }
  const ownNorm = normalizeForCompare(w.text);
  const noVariants = pool
    .filter((p) => p.id !== w.word_id)
    .map((p) => normalizeForCompare(p.text))
    .filter((t) => t !== ownNorm);
  const hasMnemonic = Boolean(w.image_url || w.keyword_text || w.bridge_sentence);
  return {
    key: itemKey('word', w.word_id),
    kind: 'word',
    id: w.word_id,
    text: w.text,
    meaning: w.meaning_en,
    romanization: w.romanization,
    audioUrl: w.pronunciation_audio_url,
    literal: null,
    mnemonic: hasMnemonic
      ? { imageUrl: w.image_url, keyword: w.keyword_text, bridge: w.bridge_sentence, description: w.scene_description }
      : null,
    alternates,
    noVariants,
    phraseWords: [],
    families: families ?? [],
  };
}

export function phraseView(p: DuePhraseForReview, words: PhraseWordMnemonic[] | undefined): ItemView {
  const hasMnemonic = Boolean(p.composite_image_url || p.phrase_bridge_sentence);
  return {
    key: itemKey('phrase', p.phrase_id),
    kind: 'phrase',
    id: p.phrase_id,
    text: p.text_target,
    meaning: p.text_en,
    romanization: null,
    audioUrl: p.audio_url,
    literal: p.literal_translation,
    mnemonic: hasMnemonic
      ? {
          imageUrl: p.composite_image_url,
          keyword: null,
          bridge: p.phrase_bridge_sentence,
          description: p.composite_scene_description,
        }
      : null,
    alternates: [],
    noVariants: [],
    phraseWords: words ?? [],
    families: [],
  };
}

export function sittingItemOfWord(w: DueWordForReview): SittingItem {
  return {
    key: itemKey('word', w.word_id),
    kind: 'word',
    id: w.word_id,
    learningStep: w.learning_step ?? 2,
    intervalDays: w.interval_days ?? 0,
    lastReviewedAt: w.last_reviewed_at ?? null,
    timesReviewed: w.times_reviewed ?? 0,
  };
}

export function sittingItemOfPhrase(p: DuePhraseForReview): SittingItem {
  return {
    key: itemKey('phrase', p.phrase_id),
    kind: 'phrase',
    id: p.phrase_id,
    learningStep: p.learning_step ?? 2,
    intervalDays: p.interval_days ?? 0,
    lastReviewedAt: p.last_reviewed_at ?? null,
    timesReviewed: p.times_reviewed ?? 0,
  };
}
