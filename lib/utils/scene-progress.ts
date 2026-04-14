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
  total_words: number;
  mastered_words: number;
}

/** Whether a scene is fully complete. */
export function isSceneComplete(scene: SceneMasteryLike): boolean {
  return !!scene.scene_completed;
}

/** Progress percentage (0-100) for a scene based on its current phase. */
export function sceneProgress(scene: SceneMasteryLike): number {
  if (scene.scene_completed) return 100;
  if (!scene.current_phase) return 0;
  return PHASE_WEIGHTS[scene.current_phase] ?? 0;
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
