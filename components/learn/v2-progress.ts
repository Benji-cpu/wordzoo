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

export type V2PhaseKind = 'intro' | 'drill' | 'converse' | 'checkpoint';

/**
 * Batch sizing, shared by VocabularyBlock and PhraseBlock.
 *
 * Both blocks used to carry their own copy of the "don't fragment small sets"
 * rule, and SceneFlowClient now needs the batch count too in order to plan one
 * conversation interlude per batch. Three copies of the same rule is a bug
 * farm — it lives here once.
 */
export const VOCAB_BATCH_SIZE = 3;
export const PHRASE_BATCH_SIZE = 2;

/**
 * Split items into drill batches. Sets of 5 or fewer stay whole so the learner
 * never hits a 1-item "mini drill" that feels pointless (user feedback).
 */
export function chunkIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const out: T[][] = [];
  if (items.length === 0) return out;
  const size = Math.max(1, items.length <= 5 ? items.length : batchSize);
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Number of batches `chunkIntoBatches` would produce, without building them. */
export function batchCount(itemCount: number, batchSize: number): number {
  if (itemCount === 0) return 0;
  const size = Math.max(1, itemCount <= 5 ? itemCount : batchSize);
  return Math.ceil(itemCount / size);
}

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
