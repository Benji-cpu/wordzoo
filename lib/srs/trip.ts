/**
 * Trip-aware scheduling, pure (no DB import) so the scheduler, the query layer
 * and the one-off repair script can all share it. The script loads its env in
 * its own body, so it must never import anything that reaches lib/db/client.ts.
 *
 * The idea: what is needed on arrival must be fresh on arrival. Far from the
 * trip the interval cap is a third of the time left; near it, nothing is
 * scheduled after trip - 3 days, so the last review is a final sweep.
 */

const DAY_MS = 86_400_000;

/** Never cap below this (a week) or above this (a month). */
const CAP_MIN_DAYS = 7;
const CAP_MAX_DAYS = 30;
/** With this few days left the cap stops mattering; only the due clamp remains. */
const NO_CAP_WITHIN_DAYS = 3;
/** Nothing comes due later than trip - this many days. */
const SWEEP_BUFFER_DAYS = 3;
/** The final sweep is spread over this many days before the buffer. */
const SWEEP_WINDOW_DAYS = 10;

function utcDateMs(d: Date | string): number | null {
  // A string is 'YYYY-MM-DD' (or a full ISO stamp): read the date part as UTC.
  // A Date's own UTC date is used, never its local one, so a Mac at UTC+8
  // cannot move the trip a day.
  const iso = typeof d === 'string' ? d.slice(0, 10) : Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const ms = Date.parse(iso + 'T00:00:00Z');
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Whole UTC days from today to the trip date. Null when there is no (valid)
 * trip. Zero or negative once the trip is today or past — callers treat those
 * as "no trip".
 */
export function tripDaysLeft(tripDate: Date | string | null | undefined, now: Date): number | null {
  if (tripDate == null) return null;
  const trip = utcDateMs(tripDate);
  const today = utcDateMs(now);
  if (trip == null || today == null) return null;
  return Math.round((trip - today) / DAY_MS);
}

/** The interval ceiling: a third of the time left, between a week and a month. */
export function tripIntervalCap(daysLeft: number | null | undefined): number | null {
  if (daysLeft == null || !Number.isFinite(daysLeft) || daysLeft <= NO_CAP_WITHIN_DAYS) return null;
  return Math.min(CAP_MAX_DAYS, Math.max(CAP_MIN_DAYS, Math.round(0.33 * daysLeft)));
}

/**
 * Spread a value that hit the cap downward by up to ~10%, so a cohort that hit
 * it on the same day doesn't come back on the same day. rand is in [0, 1).
 */
export function spread(cap: number, rand: () => number): number {
  const width = Math.max(1, Math.round(cap * 0.1));
  return Math.max(1, cap - Math.floor(rand() * width));
}

/**
 * The final sweep: an interval that would land after trip - 3 days becomes a
 * value spread over [max(1, daysLeft - 10), daysLeft - 3]. Untouched when the
 * trip is close (daysLeft <= 4), far, or the interval already fits.
 */
export function tripDueClamp(intervalDays: number, daysLeft: number | null | undefined, rand: () => number): number {
  if (daysLeft == null || !Number.isFinite(daysLeft) || daysLeft <= SWEEP_BUFFER_DAYS + 1) return intervalDays;
  const hi = daysLeft - SWEEP_BUFFER_DAYS;
  if (intervalDays <= hi) return intervalDays;
  const lo = Math.max(1, daysLeft - SWEEP_WINDOW_DAYS);
  return lo + Math.floor(rand() * (hi - lo + 1));
}

/** Cap, spread, then clamp. Integer in, integer out; null trip means unchanged. */
export function applyTripSchedule(intervalDays: number, daysLeft: number | null | undefined, rand: () => number): number {
  const cap = tripIntervalCap(daysLeft);
  let out = intervalDays;
  if (cap != null && out > cap) out = spread(cap, rand);
  return tripDueClamp(out, daysLeft, rand);
}

/**
 * One number for bulk repairs (setUserTrip and the repair script): the largest
 * interval an existing row may keep. The cap, lowered to the sweep buffer when
 * the trip is close. Null when nothing needs capping.
 */
export function tripBulkCap(daysLeft: number | null | undefined): number | null {
  const cap = tripIntervalCap(daysLeft);
  if (cap == null) return null;
  if (daysLeft != null && daysLeft > SWEEP_BUFFER_DAYS + 1) return Math.min(cap, daysLeft - SWEEP_BUFFER_DAYS);
  return cap;
}
