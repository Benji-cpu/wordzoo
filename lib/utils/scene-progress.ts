/**
 * Scene progress constants used across components for consistent
 * progress tracking and label rendering.
 */

/** Weight of each phase in overall scene progress (0-100). */
export const PHASE_WEIGHTS: Record<string, number> = {
  'scene-intro': 0,
  dialogue: 10,
  phrases: 30,
  vocabulary: 50,
  patterns: 70,
  affixes: 85,
  summary: 100,
};

/** Human-readable labels for each phase. */
export const PHASE_LABELS: Record<string, string> = {
  'scene-intro': 'Intro',
  dialogue: 'Dialogue',
  phrases: 'Phrases',
  vocabulary: 'Vocabulary',
  patterns: 'Patterns',
  affixes: 'Affixes',
  summary: 'Summary',
};
