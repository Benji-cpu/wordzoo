/**
 * The catch-up composer for a review sitting. Pure: the engine fetches two
 * ordered lists and this merges them, so the rule is testable without a DB.
 *
 * Normally a sitting is the weakest items first (learning, then the shortest
 * intervals). But a learner with a big backlog would then never see the mature
 * items, which keep aging into forgotten. When more than CATCH_UP_FROM_DUE
 * items are due, about 30% of each list's slots go to the most overdue mature
 * items instead.
 */

export const CATCH_UP_FROM_DUE = 40;
export const CATCH_UP_SHARE = 0.3;
/** Interval (days) from which an item counts as mature. */
export const MATURE_FROM_DAYS = 7;

/** How many of `slots` are reserved for mature items; 0 when not catching up. */
export function catchUpSlots(slots: number, totalDue: number): number {
  if (totalDue <= CATCH_UP_FROM_DUE || slots <= 0) return 0;
  return Math.min(slots, Math.round(slots * CATCH_UP_SHARE));
}

export interface ComposeInput<T> {
  /** Weak-first order (the standard due order), best candidates first. */
  weakFirst: T[];
  /** Mature (interval >= 7) items, most overdue first. Ignored unless catching up. */
  matureOverdue: T[];
  slots: number;
  /** Words plus phrases due right now. */
  totalDue: number;
  key: (item: T) => string;
  intervalDays: (item: T) => number;
}

/**
 * Up to `slots` items. The mature picks are spread evenly through the list
 * rather than tacked on the end, so a sitting abandoned halfway still touched
 * them. No duplicates; a short mature list just leaves more room for weak items.
 */
export function composeSitting<T>(input: ComposeInput<T>): T[] {
  const { weakFirst, matureOverdue, slots, totalDue, key, intervalDays } = input;
  if (slots <= 0) return [];

  const want = catchUpSlots(slots, totalDue);
  const mature: T[] = [];
  const seen = new Set<string>();
  for (const item of matureOverdue) {
    if (mature.length >= want) break;
    if (intervalDays(item) < MATURE_FROM_DAYS || seen.has(key(item))) continue;
    seen.add(key(item));
    mature.push(item);
  }

  const weak: T[] = [];
  for (const item of weakFirst) {
    if (weak.length >= slots - mature.length) break;
    if (seen.has(key(item))) continue;
    seen.add(key(item));
    weak.push(item);
  }

  if (mature.length === 0) return weak;
  const out = weak.slice();
  // Insert from the back so earlier positions stay valid.
  for (let i = mature.length - 1; i >= 0; i--) {
    const pos = Math.floor(((i + 1) * (weak.length + 1)) / (mature.length + 1));
    out.splice(Math.min(pos, out.length), 0, mature[i]);
  }
  return out;
}
