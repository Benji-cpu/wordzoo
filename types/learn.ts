import type { ClozePhraseForWord } from '@/lib/db/queries';

export interface LearnWordFamily {
  affix_type: string;
  derived_word: string;
  derived_meaning: string;
  meaning_shift: string;
}

export interface LearnWord {
  word: {
    id: string;
    text: string;
    romanization: string | null;
    meaning_en: string;
    part_of_speech: string;
    pronunciation_audio_url: string | null;
    informal_text: string | null;
    register: 'formal' | 'informal' | 'neutral';
  };
  mnemonic: {
    id: string;
    keyword_text: string;
    scene_description: string;
    bridge_sentence: string | null;
    image_url: string | null;
  } | null;
  distractors: string[];
  userWordStatus: string | null;
  wordFamilies?: LearnWordFamily[];
  /** Cloze candidates for Pedagogy v2. Populated only when the cloze
   * slice is enabled. Optional so the legacy quiz path doesn't pay the
   * extra query. */
  clozePhrases?: ClozePhraseForWord[];
}
