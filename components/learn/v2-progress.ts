/**
 * Bridge that lets v2 blocks (VocabularyBlock, PhraseBlock) report internal
 * progress + handle "back" navigation to the parent SceneFlowClient, and
 * carries the serializable sub-state needed to resume after the user leaves
 * and re-enters a scene mid-phase.
 *
 * Without this, the parent's FlowState is frozen at `wordIndex: 0` for the
 * whole vocab phase — the progress bar parks, the back button skips the
 * entire phase, and the DB row never advances past the phase entry index.
 */

export type V2PhaseKind = 'intro' | 'drill' | 'checkpoint';

export interface V2BlockProgress {
  /** Position within the v2 block, 0..1. Maps to phaseProgress in the parent. */
  fraction: number;
  /**
   * Step back inside the block. Returns true if the block consumed the
   * back action; false → the parent should fall through to its own
   * computePreviousState (i.e. exit the phase).
   */
  goBack: () => boolean;
  /** Serializable sub-state the parent persists to user_scene_progress. */
  kind: V2PhaseKind;
  batchIndex: number;
}

/** Optional initial sub-state the parent restores from user_scene_progress. */
export interface V2InitialState {
  kind: V2PhaseKind;
  batchIndex: number;
}
