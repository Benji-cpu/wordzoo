/**
 * Exercise picker for the Phase 4 DrillBlock.
 *
 * Given a drill item, decides which cue type to test it under next. Strategy:
 *   - Skip cue types the item has already passed this session
 *   - Skip cue types the item is ineligible for (e.g. cloze requires the
 *     word to appear in a scene_phrase; listening requires audio_url)
 *   - Among eligible-and-not-yet-passed types, round-robin with RNG tie-break
 */

import type { CueType, DrillItem } from './leitner';

export interface PickerEligibility {
  hasMnemonic: boolean;
  hasAudioUrl: boolean;
  /** Word appears in at least one scene_phrase via phrase_words. */
  hasClozePhrase: boolean;
  /** Pedagogy v2 cloze + pattern slice (Phase 5) is on. */
  clozeEnabled: boolean;
}

const FALLBACK_CUE: CueType = 'recognition';

export function eligibleCueTypes(eligibility: PickerEligibility): CueType[] {
  const out: CueType[] = ['recognition', 'production'];
  if (eligibility.clozeEnabled && eligibility.hasClozePhrase) out.push('cloze');
  if (eligibility.clozeEnabled && eligibility.hasAudioUrl) out.push('listening');
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
