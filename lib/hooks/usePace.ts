'use client';

import { useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { BEAT, paceFor, type BeatName } from '@/lib/ui/pace';

interface PaceOptions {
  /**
   * Which repetition of this kind of thing the learner is on — the first word of a
   * scene is 0, the fifth is 4. Reveals shorten as this grows; see `paceFor`.
   */
  unitIndex?: number;
  /**
   * The learner's own multiplier, once the setting exists. Below 1 is quicker.
   * Deliberately not surfaced during onboarding: the tuned curve is the first
   * impression, and a speed control is meaningless before you know the speed.
   */
  scale?: number;
}

/**
 * Scale every timed beat to this learner, right now.
 *
 * Under `prefers-reduced-motion` every duration collapses to zero. That matters
 * more here than the CSS block in globals.css suggests: that rule only flattens
 * animation and transition durations, so before this hook a learner who had asked
 * for no motion still sat through the full four-and-a-half-second reveal, waiting
 * on timers they could not see the point of.
 */
export function usePace({ unitIndex = 0, scale = 1 }: PaceOptions = {}) {
  const reduced = useReducedMotion();
  const factor = reduced ? 0 : paceFor(unitIndex) * scale;

  const t = useCallback((ms: number) => Math.round(ms * factor), [factor]);
  const beat = useCallback((name: BeatName) => Math.round(BEAT[name] * factor), [factor]);

  return { t, beat, factor, reduced: Boolean(reduced) };
}
