import type { ScenePhraseWithMnemonics } from '@/types/database';

/**
 * Build MCQ distractors for phrase recognition by sampling other phrases
 * in the same scene. Returns at most 3 distractors. Used by PhraseQuiz
 * (legacy show→quiz flow) and PhraseDrillBlock (Pedagogy v2 recognition
 * cue). When the scene has fewer than 4 phrases the caller should skip
 * recognition and fall back to production / cloze.
 */
export function buildPhraseDistractors(
  allPhrases: Pick<ScenePhraseWithMnemonics, 'text_target'>[],
  targetText: string,
  count: number = 3,
): string[] {
  return allPhrases
    .filter((p) => p.text_target !== targetText)
    .map((p) => p.text_target)
    .slice(0, count);
}
