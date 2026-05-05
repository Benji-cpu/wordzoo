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

interface SceneMasteryLike {
  scene_completed: boolean;
  current_phase: string | null;
  phase_index?: number | null;
  total_words: number;
  mastered_words: number;
}

/** Whether a scene is fully complete. */
export function isSceneComplete(scene: SceneMasteryLike): boolean {
  return !!scene.scene_completed;
}

const PHASE_ORDER = ['scene-intro', 'dialogue', 'phrases', 'vocabulary', 'patterns', 'affixes', 'summary'];

/**
 * Progress percentage (0-100) for a scene. Combines:
 *  - phase weight (where in the scene the user is overall)
 *  - within-vocabulary mastered_words/total_words to interpolate between
 *    vocabulary's start (50) and the next phase's weight
 *
 * Lets the dashboard's "Continue Learning" card reflect mid-scene progress
 * rather than freezing at the boundary of each phase.
 */
export function sceneProgress(scene: SceneMasteryLike): number {
  if (scene.scene_completed) return 100;
  if (!scene.current_phase) return 0;

  const base = PHASE_WEIGHTS[scene.current_phase] ?? 0;
  const idx = PHASE_ORDER.indexOf(scene.current_phase);
  const nextPhase = idx >= 0 && idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1] : null;
  const next = nextPhase ? (PHASE_WEIGHTS[nextPhase] ?? base) : 100;

  // Vocabulary phase: use mastered_words/total_words ratio for fine progress.
  if (scene.current_phase === 'vocabulary' && scene.total_words > 0) {
    const ratio = Math.min(1, Math.max(0, scene.mastered_words / scene.total_words));
    return Math.round(base + (next - base) * ratio);
  }

  // Other phases that track an index (dialogue lines, phrase index): nudge
  // forward 25% of the way to the next phase per logged step. This keeps the
  // bar moving even before mastery rolls in.
  if (scene.phase_index != null && scene.phase_index > 0) {
    const stepBoost = Math.min(0.7, scene.phase_index * 0.25);
    return Math.round(base + (next - base) * stepBoost);
  }

  return base;
}

/** Human-readable status label for a scene. */
export function sceneStatusLabel(scene: SceneMasteryLike): string {
  if (scene.scene_completed) return 'Complete';
  if (scene.current_phase) return PHASE_LABELS[scene.current_phase] ?? 'In Progress';
  return 'Not Started';
}

/** Index of the first incomplete scene, or 0 if all complete. */
export function findCurrentSceneIndex(scenes: SceneMasteryLike[]): number {
  const idx = scenes.findIndex(s => !isSceneComplete(s));
  return idx === -1 ? 0 : idx;
}
