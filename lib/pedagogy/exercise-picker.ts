/**
 * Exercise picker for the Phase 4 DrillBlock.
 *
 * Given a drill item, decides which cue type to test it under next. Strategy:
 *   - Only cue types the parent actually enabled
 *   - Only cue types DrillBlock can actually render (see RENDERABLE_CUE_TYPES)
 *   - Skip cue types the item has already passed this session
 *   - Skip cue types the item is ineligible for (e.g. cloze requires the
 *     word to appear in a scene_phrase)
 *   - Among what's left, round-robin with RNG tie-break
 *
 * This mirrors `lib/pedagogy/phrase-exercise-picker.eligiblePhraseCueTypes`,
 * which takes the enabled list directly. This module used to take a single
 * `clozeEnabled` boolean instead, and that lossy flattening caused two bugs —
 * see RENDERABLE_CUE_TYPES below.
 */

import type { CueType, DrillItem } from './leitner';

/**
 * The cue types DrillBlock has a render branch for. `listening` and `pattern`
 * are members of the CueType union but have no branch, so the picker must
 * never emit them.
 *
 * This is the fix for a real scoring bug: the picker used to add `listening`
 * whenever cloze was on and the word had audio, but DrillBlock's render falls
 * through to the recognition MCQ. The learner saw a multiple-choice question
 * headed "hear & type", answered it by reading, and the Leitner queue credited
 * `listening` as passed — i.e. they were graded on a modality they were never
 * tested in.
 *
 * `ListeningExercise.tsx` exists (282 lines) but is not wired: it carries its
 * own local Levenshtein with a flat edit allowance, which would reintroduce
 * exactly the short-word free-pass fixed in 6712580. Wiring it means first
 * moving it onto `fuzzyMatchAnswer` from lib/pedagogy/normalize.
 *
 * Add a cue type here only when DrillBlock can draw it.
 */
export const RENDERABLE_CUE_TYPES: readonly CueType[] = ['recognition', 'production', 'cloze'];

export interface PickerEligibility {
  hasMnemonic: boolean;
  hasAudioUrl: boolean;
  /** Word appears in at least one scene_phrase via phrase_words. */
  hasClozePhrase: boolean;
  /** Cue types the parent enabled for this build (from the pedagogy flags). */
  enabledCueTypes: CueType[];
}

const FALLBACK_CUE: CueType = 'recognition';

export function eligibleCueTypes(eligibility: PickerEligibility): CueType[] {
  const enabled = new Set(eligibility.enabledCueTypes);
  const renderable = new Set(RENDERABLE_CUE_TYPES);
  const wanted: CueType[] = [];

  // `production` is gated on the enabled list rather than being unconditional.
  // It used to be hard-coded in alongside recognition, which meant the
  // `production` pedagogy slice had no effect on the drill picker — typing was
  // served whether or not the flag was on.
  if (enabled.has('production')) wanted.push('production');
  if (enabled.has('cloze') && eligibility.hasClozePhrase) wanted.push('cloze');

  const out = wanted.filter((c) => renderable.has(c));

  // Recognition is the floor: it needs no data beyond the word itself, so it
  // guarantees the pool is never empty even if every flag is off.
  out.unshift(FALLBACK_CUE);
  return out;
}

export function pickCueType(item: DrillItem, eligibility: PickerEligibility): CueType {
  const all = eligibleCueTypes(eligibility);
  const passed = new Set(item.cueTypesPassed);
  const owed = all.filter((c) => !passed.has(c));
  if (owed.length === 0) {
    // All cue types passed (rare — usually means K was lowered mid-session).
    // Fall back to recognition; the queue will pop this item next anyway.
    return all[0] ?? FALLBACK_CUE;
  }
  return owed[Math.floor(Math.random() * owed.length)];
}
