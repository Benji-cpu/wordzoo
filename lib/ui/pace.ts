/**
 * Every timed beat in the app, in one place.
 *
 * Before this file the app kept three unrelated ideas of how long a moment is:
 * CSS custom properties in globals.css that no JavaScript ever read, framer-motion
 * literals in the onboarding demo, and bare `setTimeout` integers scattered through
 * the learn components. The numbers below are not new — they are the ones already
 * in use, which had converged by copy-paste and are now merely named:
 *
 *   220ms   RatingButtons        — a tap acknowledged before the card leaves
 *   400ms   Cloze, ProductionTyping — the shake on a wrong answer
 *   1100ms  QuizOptions, Cloze, ProductionTyping — reading "correct" before advancing
 *   1300ms  QuizOptions          — the same, when an explanation has to be read
 *   2000ms  FeedbackButtons, MnemonicCard — a toast that nobody has to dismiss
 *
 * Mirrored as `--beat-*` custom properties in app/globals.css. This file is the
 * source of truth; if you change a number here, change it there too.
 */

export const BEAT = {
  /** A tap acknowledged before the thing it acted on disappears. */
  tapAdvance: 220,
  /** How long a wrong answer shakes. */
  shake: 400,
  /** The breath between two spoken lines of dialogue. */
  linePause: 400,
  /** Reading "correct" before the flow moves on. */
  dwellCorrect: 1100,
  /** The same, where an explanation has to be read first. */
  dwellReveal: 1300,
  /** A message that appears and leaves without being dismissed. */
  toast: 2000,
} as const;

export type BeatName = keyof typeof BEAT;

/**
 * How long something takes to move, as opposed to how long the app waits.
 *
 * These mirror the `--duration-*` custom properties in app/globals.css, which
 * existed first and which no JavaScript had ever read — so a component animating
 * in framer-motion and the same component's CSS transition disagreed by default.
 * `pace.test.ts` parses globals.css and fails if the two drift apart.
 */
export const MOTION = {
  micro: 150,
  transition: 250,
  reveal: 400,
  spring: 350,
  celebrate: 600,
  big: 900,
} as const;

/**
 * The reveal ladder, in milliseconds from the start of a sequence.
 *
 * Taken unchanged from the onboarding demo (`components/onboarding/WordReveal.tsx`),
 * which is the pacing everything else is being brought in line with. Six steps: the
 * meaning, the bridge line, the keyword, the image, the caption, then ready. A
 * sequence with fewer beats than this uses the first N.
 */
export const REVEAL_STEPS = [1000, 2000, 2500, 3500, 4000, 4500] as const;

/**
 * Build a ladder from the GAPS between beats rather than absolute times.
 *
 * Absolute times are why every reveal in the app used to be retyped: inserting a
 * beat in the middle means editing every number after it, so nobody did, and each
 * component grew its own unrelated ladder. Gaps compose — `ladder(600, 600, 400)`
 * says what it means, and `pace.test.ts` proves it reproduces the demo exactly.
 *
 * The demo's rhythm, for reference: a full second for a new idea, half a second
 * for a detail of one already on screen.
 */
export function ladder(...gaps: number[]): number[] {
  let at = 0;
  return gaps.map((gap) => (at += gap));
}

/**
 * How much quicker each repetition of the same kind of thing gets.
 *
 * The demo hard-coded [1.0, 0.8, 0.6] across its three words and that acceleration
 * is the thing that makes it feel good: the first word is taught, the fourth is
 * merely shown, because by then the learner knows the shape of the reveal and is
 * waiting on it. Generalised here to any repeated unit, resetting at each scene so
 * a new sitting never opens at full speed.
 */
export const PACE_FLOOR = 0.55;

/**
 * Written out rather than computed, because the decay is not linear: it drops
 * fastest between the first and second repetition, where the learner's gain in
 * familiarity is largest, and flattens as it approaches the floor. A constant step
 * reaches the floor by the fourth item and the last third of a scene all runs at
 * one speed.
 */
const PACE_CURVE = [1, 0.85, 0.7, 0.6] as const;

export function paceFor(unitIndex: number): number {
  return PACE_CURVE[Math.max(0, unitIndex)] ?? PACE_FLOOR;
}
