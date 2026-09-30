/**
 * New content waits for what is still fragile.
 *
 * A scene dumps ~17 items into the review queue at learning step 0. Opening the
 * next scene on top of that is how a 285-item backlog happened, so an
 * unstarted scene opens only when few fragile items are due. The gate is soft
 * (`?anyway=1` skips it) and never traps: a scene already started or finished
 * is always open. Pure decisions and copy live here; the SQL is in
 * lib/db/gate-queries.ts.
 */

/** Fragile items due at which a NEW scene stops opening. Open at <= this. */
export const GATE_THRESHOLD = 8;

/** Seconds one first-pass review card takes, for the honest time estimate. */
export const SECONDS_PER_REVIEW_CARD = 20;

export interface GateResult {
  open: boolean;
  fragileDue: number;
  threshold: number;
  languageId: string | null;
}

export interface GateDecisionInput {
  fragileDue: number;
  /** A user_scene_progress row exists: the learner is already in this scene. */
  sceneStarted: boolean;
  sceneCompleted: boolean;
  threshold?: number;
}

export function decideGate({
  fragileDue,
  sceneStarted,
  sceneCompleted,
  threshold = GATE_THRESHOLD,
}: GateDecisionInput): { open: boolean; fragileDue: number; threshold: number } {
  const open = sceneStarted || sceneCompleted || fragileDue <= threshold;
  return { open, fragileDue, threshold };
}

/** ~20 s a card, rounded up to the minute (never 0 for a non-empty sitting). */
export function reviewMinutes(cards: number): number {
  if (cards <= 0) return 0;
  return Math.max(1, Math.ceil((cards * SECONDS_PER_REVIEW_CARD) / 60));
}

export function gateHeadline(): string {
  return "Lock in what you've learned first";
}

export function gateBody(fragileDue: number): string {
  const items = fragileDue === 1 ? '1 item is' : `${fragileDue} items are`;
  return `${items} still fragile. A short round now makes them stick, then this scene opens.`;
}

export function practiseLabel(fragileDue: number): string {
  return `Practise ${fragileDue} now`;
}

export function lockInFirstLabel(fragileDue: number): string {
  return `Lock in ${fragileDue} first`;
}

// --- Pace note --------------------------------------------------------------

/** The last family scene of the trip: the one Ben most needs before 20 Dec. */
export const TRIP_TARGET_SCENE_ID = 'd4000000-0001-4000-8000-000000000052';
export const PACE_WINDOW_DAYS = 14;

export interface PaceScene {
  id: string;
  title: string;
  completed: boolean;
}

export interface PaceInput {
  /** Scenes in path order. */
  scenes: PaceScene[];
  /** Scenes completed in the last PACE_WINDOW_DAYS days. */
  completedRecently: number;
  targetSceneId?: string;
  /** Trip date as YYYY-MM-DD; without one there is no deadline to speak of. */
  tripDate: string | null;
  now?: Date;
}

const DAY_MS = 86_400_000;

function formatDay(d: Date): string {
  return `${d.getUTCDate()} ${d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })}`;
}

/**
 * One line: where the current pace lands the target scene. Null when there is
 * nothing to say (no trip, target absent or already done).
 */
export function paceNote({
  scenes,
  completedRecently,
  targetSceneId = TRIP_TARGET_SCENE_ID,
  tripDate,
  now = new Date(),
}: PaceInput): string | null {
  if (!tripDate) return null;
  const targetIdx = scenes.findIndex((s) => s.id === targetSceneId);
  if (targetIdx < 0 || scenes[targetIdx].completed) return null;
  const target = scenes[targetIdx];
  const trip = new Date(`${tripDate}T00:00:00Z`);

  if (completedRecently <= 0) {
    return `Do one scene this week to reach ${target.title} before ${formatDay(trip)}`;
  }

  // Scenes still to do up to and including the target, at the recent rate.
  const remaining = scenes.slice(0, targetIdx + 1).filter((s) => !s.completed).length;
  const perDay = completedRecently / PACE_WINDOW_DAYS;
  const days = Math.ceil(remaining / perDay);
  const arrives = new Date(now.getTime() + days * DAY_MS);
  const late = arrives.getTime() > trip.getTime();
  return `At this pace: ${target.title} by ${formatDay(arrives)}${late ? ` (after ${formatDay(trip)})` : ''}`;
}
