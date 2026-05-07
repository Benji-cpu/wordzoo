/**
 * Bridge that lets v2 blocks (VocabularyBlock, PhraseBlock) report internal
 * progress + handle "back" navigation to the parent SceneFlowClient.
 *
 * Without this, the parent's FlowState is frozen at `wordIndex: 0` for the
 * whole vocab phase — the progress bar parks and the back button skips the
 * entire phase. See plan: scene 11 blank-page / back-restart fix.
 */

export interface V2BlockProgress {
  /** Position within the v2 block, 0..1. Maps to phaseProgress in the parent. */
  fraction: number;
  /**
   * Step back inside the block. Returns true if the block consumed the
   * back action; false → the parent should fall through to its own
   * computePreviousState (i.e. exit the phase).
   */
  goBack: () => boolean;
}
