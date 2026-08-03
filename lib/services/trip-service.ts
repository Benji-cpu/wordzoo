import { getUserTrip, setUserTrip, clearUserTrip, type UserTrip } from '@/lib/db/queries';
import { getUserActivePath, getPathWordStats } from '@/lib/db/queries';
import { getCanDoInventory } from '@/lib/db/can-do-queries';

export type TripStatus = 'none' | 'on_track' | 'ahead' | 'slipping' | 'behind' | 'past';

export interface TripContext {
  hasTrip: boolean;
  destination: string | null;
  countryCode: string | null;
  tripDate: string | null;
  daysRemaining: number | null;
  targetWordCount: number;
  wordsMastered: number;
  wordsRemaining: number;
  paceNeeded: number | null;
  status: TripStatus;
  /**
   * Capability, which is what the learner actually wants: "I can ask a driver
   * how much a ride costs" beats "217 words mastered". Certified means it
   * passed a delayed, unaided production test.
   *
   * These drive the meter whenever `canDosTotal > 0`; otherwise it falls back
   * to the word count, because a learner who hasn't finished a scene yet has
   * no can-dos unlocked and an empty bar would tell them nothing.
   */
  canDosCertified: number;
  canDosTotal: number;
  /** True when the meter is reading capability rather than word count. */
  measuresCapability: boolean;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

function diffDays(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + 'T00:00:00Z').getTime();
  const to = new Date(toISO + 'T00:00:00Z').getTime();
  return Math.round((to - from) / 86_400_000);
}

function deriveStatus(daysRemaining: number, mastered: number, target: number): TripStatus {
  if (daysRemaining < 0) return 'past';
  if (mastered >= target) return 'ahead';
  // Required pace bands tuned for casual learners — 8/day is "normal", 15+ is push.
  const remaining = target - mastered;
  const pace = remaining / Math.max(1, daysRemaining);
  if (pace <= 8) return 'on_track';
  if (pace <= 15) return 'slipping';
  return 'behind';
}

export async function getTripContext(userId: string): Promise<TripContext> {
  const trip = await getUserTrip(userId);
  if (!trip || !trip.trip_date || !trip.trip_destination) {
    return emptyContext(trip);
  }

  const daysRemaining = diffDays(todayISODate(), trip.trip_date);

  let mastered = 0;
  let canDosCertified = 0;
  let canDosTotal = 0;
  try {
    const activePath = await getUserActivePath(userId);
    if (activePath) {
      const [stats, inventory] = await Promise.all([
        getPathWordStats(userId, activePath.id),
        getCanDoInventory(userId, activePath.path_language_id ?? null),
      ]);
      mastered = stats.words_mastered ?? 0;
      canDosCertified = inventory.certified;
      canDosTotal = inventory.certified + inventory.unlocked;
    }
  } catch {
    // Soft-fail; trip context should never break the dashboard.
  }

  const target = trip.trip_target_word_count ?? 200;
  const remaining = Math.max(0, target - mastered);

  // Capability is the headline whenever there is any to report. Words stay as
  // the secondary line — they were never a bad number, just a bad *headline*:
  // "mastered" was reachable in about four self-graded taps.
  const measuresCapability = canDosTotal > 0;
  const paceUnit = measuresCapability ? canDosTotal - canDosCertified : remaining;
  const paceNeeded = daysRemaining > 0 ? Math.ceil(paceUnit / daysRemaining) : null;
  const status = measuresCapability
    ? deriveStatus(daysRemaining, canDosCertified, canDosTotal)
    : deriveStatus(daysRemaining, mastered, target);

  return {
    hasTrip: true,
    destination: trip.trip_destination,
    countryCode: trip.trip_country_code,
    tripDate: trip.trip_date,
    daysRemaining,
    targetWordCount: target,
    wordsMastered: mastered,
    wordsRemaining: remaining,
    paceNeeded,
    status,
    canDosCertified,
    canDosTotal,
    measuresCapability,
  };
}

function emptyContext(trip: UserTrip | null): TripContext {
  return {
    hasTrip: false,
    destination: null,
    countryCode: null,
    tripDate: null,
    daysRemaining: null,
    targetWordCount: trip?.trip_target_word_count ?? 200,
    wordsMastered: 0,
    wordsRemaining: 0,
    paceNeeded: null,
    status: 'none',
    canDosCertified: 0,
    canDosTotal: 0,
    measuresCapability: false,
  };
}

export async function setTrip(userId: string, params: {
  destination: string;
  countryCode?: string | null;
  date: string;
  targetWordCount?: number;
}): Promise<TripContext> {
  await setUserTrip(userId, params);
  return getTripContext(userId);
}

export async function clearTrip(userId: string): Promise<void> {
  await clearUserTrip(userId);
}
