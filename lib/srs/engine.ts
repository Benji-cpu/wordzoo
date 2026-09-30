import { after } from 'next/server';
import {
  getDueWordsForReview,
  getDueWordCount,
  getOrCreateUserWord,
  updateWordSRS,
  updateUserStreak,
  recordIntroduction,
} from '@/lib/db/queries';
import type { DueWordForReview, SrsWrite } from '@/lib/db/queries';
import {
  getOrCreateUserPhrase,
  updatePhraseSRS,
  getDuePhrasesForReview,
  getDuePhraseCount,
} from '@/lib/db/scene-flow-queries';
import type { DuePhraseForReview } from '@/lib/db/scene-flow-queries';
import { sql } from '@/lib/db/client';
import { tripDaysLeft, tripIntervalCap, spread, tripDueClamp } from './trip';
import { catchUpSlots, composeSitting } from './sitting';

export type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';

/**
 * Where the review came from. See ReviewSourceEnum in types/api.ts for why this
 * matters: only 'review' is genuine delayed retrieval. 'practice' is the
 * "Practice now" mode on items that aren't due; it behaves like 'scene'.
 */
export type ReviewSource = 'review' | 'scene' | 'tutor' | 'practice';

/**
 * Emit one row per scheduled review so retention can be bucketed by the
 * interval the review actually happened at.
 *
 * This is written server-side rather than through /api/telemetry/pedagogy
 * because the engine already holds userId and the pre-update SRS state, and
 * because the HTTP route's event field is free-form. A telemetry failure must
 * never fail a learner's review.
 *
 * It runs in next/server's after() so the serverless function stays alive long
 * enough to write it (a bare detached promise is killed with the response).
 * after() throws outside a request scope — the tutor path calls the engine
 * from a detached IIFE — so that case falls back to a plain fire-and-forget.
 * created_at is explicit: the row is written after the review, not at it.
 */
function emitReviewEvent(userId: string, payload: Record<string, unknown>, at: Date): void {
  const write = () =>
    sql`
      INSERT INTO pedagogy_events (user_id, event, payload, created_at)
      VALUES (${userId}, 'srs_review_recorded', ${JSON.stringify(payload)}::jsonb, ${at.toISOString()})
    `.then(
      () => undefined,
      () => undefined
    );
  try {
    after(write);
  } catch {
    void write();
  }
}

/**
 * Whole days since the learner last answered this item; null on first sight.
 *
 * Carried on every review event because it is the x-axis of the question the
 * app exists to answer — is a word still there a week later? — and
 * priorIntervalDays can't answer it: after a long break a 1-day item is
 * reviewed 50 days late and still reads as "1d".
 */
export function daysAway(lastReviewedAt: Date | string | null | undefined, now: Date): number | null {
  if (!lastReviewedAt) return null;
  const last = new Date(lastReviewedAt).getTime();
  if (Number.isNaN(last)) return null;
  return Math.max(0, Math.floor((now.getTime() - last) / 86_400_000));
}

function calculateStatus(intervalDays: number): 'learning' | 'reviewing' | 'mastered' {
  if (intervalDays >= 30) return 'mastered';
  if (intervalDays >= 7) return 'reviewing';
  return 'learning';
}

/** Nothing schedules further out than this. */
const MAX_INTERVAL_DAYS = 365;
/** Intervals at or above this get fuzzed so same-session cohorts don't clump. */
const FUZZ_FROM_DAYS = 4;
/** Lapses (failures of an already-graduated item) before it is judged a leech. */
export const LEECH_LAPSES = 6;
/** A leech never schedules beyond this, so it keeps circulating. */
export const LEECH_MAX_INTERVAL_DAYS = 21;

const DAY_MS = 24 * 60 * 60 * 1000;
/** An item counts as due this long before its next_review_at (clock skew, a refresh). */
const DUE_TOLERANCE_MS = 30_000;
/** A learning item answered this soon after its last touch doesn't advance. */
const LEARNING_FLOOR_MS = 15_000;

/** learning_step value meaning "out of the learning phase, on a real interval". */
const GRADUATED = 2;

/** Days a brand-new item graduates to, by the rating that graduated it. */
const NEW_GRADUATING_INTERVAL_DAYS = { got_it: 1, instant: 3 } as const;

/** Explicit ease deltas for graduated reviews. Clearer than SM-2's polynomial,
 *  and lets a lapse cost a survivable 0.20 rather than SM-2's punitive 0.80. */
const EASE_DELTA: Record<Rating, number> = {
  forgot: -0.2,
  hard: -0.15,
  got_it: 0,
  instant: 0.1,
};
const MIN_EASE = 1.3;
const MAX_EASE = 2.7;

/** "Hard" still advances, but barely. */
const HARD_INTERVAL_MULTIPLIER = 1.2;
/** "Easy" gets a bonus on top of the ease factor. */
const EASY_INTERVAL_BONUS = 1.3;
/** A miss keeps some of the earned interval rather than resetting to zero. */
const LAPSE_INTERVAL_MULTIPLIER = 0.3;

/**
 * Spread an interval by ±5% (at least ±1 day) so a batch of words learned in
 * one sitting doesn't all come due on the same future day.
 */
function fuzzInterval(days: number, rand: () => number): number {
  if (days < FUZZ_FROM_DAYS) return days;
  const width = Math.max(1, Math.round(days * 0.05));
  const offset = Math.floor(rand() * (width * 2 + 1)) - width;
  return Math.max(FUZZ_FROM_DAYS, days + offset);
}

export interface ScheduleInput {
  rating: Rating;
  /** Only 'review' is genuine delayed retrieval — see ReviewSource. */
  source: ReviewSource;
  easeFactor: number;
  intervalDays: number;
  /** 0 = awaiting the first recall, 1 = same (legacy), 2 = graduated. */
  learningStep: number;
  lapses: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  now: Date;
  /** users.trip_date as 'YYYY-MM-DD' (or a Date); null/absent = no trip. */
  tripDate?: Date | string | null;
  /** Injectable for tests; defaults to Math.random. */
  rand?: () => number;
}

/** Why the schedule moved (or didn't). Recorded on every review event so the
 *  digest can prove in-scene answers stopped inflating the schedule. */
export type ReviewReason =
  | 'learning_step'
  | 'graduated'
  | 'review_advance'
  | 'lapse'
  | 'practice_no_advance'
  | 'conflict';

export interface ScheduleResult {
  easeFactor: number;
  /** Always an integer. May be trip-capped. */
  intervalDays: number;
  /** The interval before the trip cap/clamp; status comes from this so the cap never demotes "mastered". */
  statusIntervalDays: number;
  learningStep: number;
  lapses: number;
  nextReviewAt: Date;
  isCorrect: boolean;
  isLeech: boolean;
  /** True when a real lapse actually cost ease. */
  penalized: boolean;
  reason: ReviewReason;
}

function clampEase(ef: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, ef));
}

function daysFromNow(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

/** True when the item is due: no schedule yet, or within 30 s of it. */
export function isDue(nextReviewAt: Date | null, now: Date): boolean {
  return nextReviewAt == null || now.getTime() >= nextReviewAt.getTime() - DUE_TOLERANCE_MS;
}

/**
 * SM-2-derived scheduling, shared by words and phrases. Pure.
 *
 * The governing rule: **in-session evidence can only make the schedule
 * tighter, never looser.** Concretely:
 *
 * - **Only source 'review' advances**, and only when the item is DUE:
 *   `nextReviewAt == null || now >= nextReviewAt - 30s` (never lastReviewedAt +
 *   interval; a scene touch moves lastReviewedAt but must not un-due an item).
 *   Any other correct answer (scene, tutor, practice, or not due) changes
 *   nothing: `practice_no_advance`.
 * - **Learning phase** (learning_step < 2; step 1 is treated as 0). A due
 *   review answer graduates on got_it/instant (new item: 1 / 3 days;
 *   relearning item: the reduced interval it already carries). hard stays
 *   learning, due now ("almost — ask again"), and forgot resets to step 0, due
 *   now. Ease NEVER moves here, and none of it is a lapse. A learning item
 *   answered within 15 s of its last touch doesn't advance (double posts,
 *   back-to-back re-asks).
 * - **Graduated, due, from review.** got_it (interval + credited/2) × ease,
 *   hard (interval + credited/4) × 1.2, instant (interval + credited) × ease ×
 *   1.3; each at least interval + 1 (hard at least 1). credited = min(days
 *   overdue, interval): late success is credit for the whole gap, but never
 *   more than doubling. forgot is the only real lapse: ease −0.2, lapses + 1,
 *   interval × 0.3 (≥ 1), step 0, due now.
 * - **Any other miss** (scene/tutor/practice, or a review miss on a graduated
 *   item that isn't due) is no lapse and no ease cost, but a graduated item's
 *   interval still shrinks to 30% — a reset must never lengthen a schedule.
 * - **Caps, in order:** ±5% fuzz (from 4 days), leech 21, the trip cap
 *   (a third of the days left, 7–30, spread downward so a cohort doesn't
 *   lump), then the trip due clamp (nothing due after trip − 3 days) and 365.
 *   `status` is derived from `statusIntervalDays`, the interval before the trip
 *   cap, so the cap never demotes "mastered".
 *
 * interval_days is an INTEGER column and holds strictly the graduated
 * interval; next_review_at does the real timing.
 */
export function schedule(input: ScheduleInput): ScheduleResult {
  const { rating, source, now } = input;
  const rand = input.rand ?? Math.random;
  const isCorrect = rating !== 'forgot';
  const oldEF = input.easeFactor;
  // interval_days is an INTEGER; round defensively so nothing fractional escapes.
  const oldInterval = Math.max(0, Math.round(input.intervalDays));
  const wasGraduated = input.learningStep >= GRADUATED;
  const isReview = source === 'review';
  const due = isDue(input.nextReviewAt, now);
  const daysLeft = tripDaysLeft(input.tripDate ?? null, now);
  const isLeechAt = (lapses: number) => lapses >= LEECH_LAPSES;

  const unchanged = (reason: ReviewReason, over: Partial<ScheduleResult> = {}): ScheduleResult => ({
    easeFactor: oldEF,
    intervalDays: oldInterval,
    statusIntervalDays: oldInterval,
    learningStep: input.learningStep,
    lapses: input.lapses,
    nextReviewAt: input.nextReviewAt ?? now,
    isCorrect,
    isLeech: isLeechAt(input.lapses),
    penalized: false,
    reason,
    ...over,
  });

  // --- A miss. ---
  if (!isCorrect) {
    const realLapse = isReview && wasGraduated && due;
    if (realLapse) {
      const interval = Math.max(1, Math.round(oldInterval * LAPSE_INTERVAL_MULTIPLIER));
      const lapses = input.lapses + 1;
      return unchanged('lapse', {
        easeFactor: clampEase(oldEF + EASE_DELTA.forgot),
        intervalDays: interval,
        statusIntervalDays: interval,
        learningStep: 0,
        lapses,
        nextReviewAt: now,
        isLeech: isLeechAt(lapses),
        penalized: true,
      });
    }
    // Everything else re-opens the item without touching ease or lapses. A
    // graduated item's interval tightens; a learning item keeps whatever it has.
    const interval = wasGraduated ? Math.max(1, Math.round(oldInterval * LAPSE_INTERVAL_MULTIPLIER)) : oldInterval;
    return unchanged('lapse', {
      intervalDays: interval,
      statusIntervalDays: interval,
      learningStep: 0,
      nextReviewAt: now,
    });
  }

  // --- Correct, but not a genuine due review: nothing changes. ---
  if (!isReview || !due) return unchanged('practice_no_advance');

  // --- Learning phase. ---
  if (!wasGraduated) {
    // The floor: a re-ask seconds after the last touch is working memory.
    if (input.lastReviewedAt && now.getTime() - input.lastReviewedAt.getTime() < LEARNING_FLOOR_MS) {
      return unchanged('practice_no_advance');
    }
    if (rating === 'hard') {
      return unchanged('learning_step', { learningStep: 0, nextReviewAt: now });
    }
    // got_it / instant graduate. A relearning item returns to the interval it
    // already carries (reduced by its lapse); a new one starts small.
    const start = oldInterval > 0 ? oldInterval : NEW_GRADUATING_INTERVAL_DAYS[rating as 'got_it' | 'instant'];
    const { interval, statusInterval } = applyCaps(start, input.lapses, daysLeft, rand, false);
    return unchanged('graduated', {
      intervalDays: interval,
      statusIntervalDays: statusInterval,
      learningStep: GRADUATED,
      nextReviewAt: daysFromNow(now, interval),
    });
  }

  // --- Graduated, due, from review: a real spaced-retrieval success. ---
  //
  // Late credit (Anki's rule): a correct answer on an overdue item is evidence
  // of retention across the WHOLE gap. The gap is measured from next_review_at,
  // not last_reviewed_at + interval — a scene touch moves last_reviewed_at.
  const delayDays = input.nextReviewAt
    ? Math.max(0, Math.floor((now.getTime() - input.nextReviewAt.getTime()) / DAY_MS))
    : 0;
  const credited = Math.min(delayDays, oldInterval);
  const newEF = clampEase(oldEF + EASE_DELTA[rating]);
  let advanced: number;
  if (rating === 'hard') {
    advanced = Math.max(1, Math.round((oldInterval + credited / 4) * HARD_INTERVAL_MULTIPLIER));
  } else if (rating === 'instant') {
    advanced = Math.max(oldInterval + 1, Math.round((oldInterval + credited) * newEF * EASY_INTERVAL_BONUS));
  } else {
    advanced = Math.max(oldInterval + 1, Math.round((oldInterval + credited / 2) * newEF));
  }
  const { interval, statusInterval } = applyCaps(advanced, input.lapses, daysLeft, rand, true);
  return unchanged('review_advance', {
    easeFactor: newEF,
    intervalDays: interval,
    statusIntervalDays: statusInterval,
    learningStep: GRADUATED,
    nextReviewAt: daysFromNow(now, interval),
  });
}

/**
 * Fuzz (advance only), leech cap, then the trip cap and due clamp, then the
 * absolute ceiling. Also returns the interval before the trip step, which is
 * what an item's status is read from.
 */
function applyCaps(
  days: number,
  lapses: number,
  daysLeft: number | null,
  rand: () => number,
  fuzz: boolean
): { interval: number; statusInterval: number } {
  let d = fuzz ? fuzzInterval(days, rand) : days;
  if (lapses >= LEECH_LAPSES) d = Math.min(d, LEECH_MAX_INTERVAL_DAYS);
  const statusInterval = Math.min(d, MAX_INTERVAL_DAYS);
  const cap = tripIntervalCap(daysLeft);
  if (cap != null && d > cap) d = spread(cap, rand);
  d = tripDueClamp(d, daysLeft, rand);
  return { interval: Math.min(d, MAX_INTERVAL_DAYS), statusInterval };
}

/**
 * One review sitting: 20 cards, about five minutes. The queue used to load 20
 * words AND 20 phrases (40 cards, plus can-dos), so a learner back from seven
 * weeks away met a wall instead of a session he could finish. The rest of the
 * due queue waits for the next sitting.
 */
export const REVIEW_SITTING = { words: 14, phrases: 6 } as const;

export async function getDueWords(
  userId: string,
  limit?: number,
  _context?: string,
  languageId?: string | null
): Promise<DueWordForReview[]> {
  return getDueWordsForReview(userId, limit ?? 20, languageId);
}

export interface ReviewSitting {
  words: DueWordForReview[];
  phrases: DuePhraseForReview[];
  /** Uncapped due counts, for "N left". */
  dueWordTotal: number;
  duePhraseTotal: number;
}

/**
 * The next sitting: up to REVIEW_SITTING words and phrases in the due order
 * (see getDueWordsForReview), with the catch-up mix when a backlog is large
 * (see lib/srs/sitting.ts). priorityScene puts that scene's items first — the
 * "Lock these in" hand-off from a scene summary.
 */
export async function getReviewSitting(
  userId: string,
  languageId: string | null,
  opts?: { priorityScene?: string | null }
): Promise<ReviewSitting> {
  const priorityScene = opts?.priorityScene ?? null;
  const [dueWordTotal, duePhraseTotal] = await Promise.all([
    getDueWordCount(userId, languageId),
    getDuePhraseCount(userId, languageId),
  ]);
  const totalDue = dueWordTotal + duePhraseTotal;
  const wordMature = catchUpSlots(REVIEW_SITTING.words, totalDue);
  const phraseMature = catchUpSlots(REVIEW_SITTING.phrases, totalDue);

  const [wordsWeak, wordsMature, phrasesWeak, phrasesMature] = await Promise.all([
    // Ask for the mature slots' worth extra: the composer drops overlaps.
    getDueWordsForReview(userId, REVIEW_SITTING.words + wordMature, languageId, { priorityScene }),
    wordMature > 0
      ? getDueWordsForReview(userId, wordMature, languageId, { matureOverdue: true })
      : Promise.resolve([] as DueWordForReview[]),
    getDuePhrasesForReview(userId, REVIEW_SITTING.phrases + phraseMature, languageId, { priorityScene }),
    phraseMature > 0
      ? getDuePhrasesForReview(userId, phraseMature, languageId, { matureOverdue: true })
      : Promise.resolve([] as DuePhraseForReview[]),
  ]);

  return {
    words: composeSitting({
      weakFirst: wordsWeak,
      matureOverdue: wordsMature,
      slots: REVIEW_SITTING.words,
      totalDue,
      key: (w) => w.word_id,
      intervalDays: (w) => w.interval_days,
    }),
    phrases: composeSitting({
      weakFirst: phrasesWeak,
      matureOverdue: phrasesMature,
      slots: REVIEW_SITTING.phrases,
      totalDue,
      key: (p) => p.phrase_id,
      intervalDays: (p) => p.interval_days,
    }),
    dueWordTotal,
    duePhraseTotal,
  };
}

/** What a record call returns; the routes serialise it (nextReviewAt as ISO). */
export interface RecordedReview {
  nextReviewAt: Date;
  /** Same as intervalDays; kept for the old response shape. */
  newInterval: number;
  learningStep: number;
  intervalDays: number;
  reason: ReviewReason;
  isCorrect: boolean;
  /** learningStep >= 2 */
  known: boolean;
}

/** The columns both user_words and user_phrases give the engine. */
interface SrsRow {
  id: string;
  ease_factor: number;
  interval_days: number;
  learning_step: number;
  lapses: number;
  times_reviewed: number;
  times_correct: number;
  status: string;
  last_reviewed_at: Date | null;
  /** last_reviewed_at truncated to ms as an ISO string: the compare-and-set token. */
  last_reviewed_token: string | null;
  next_review_at: Date | null;
  trip_date: string | null;
}

function recorded(row: SrsRow, reason: ReviewReason, isCorrect: boolean): RecordedReview {
  const next = row.next_review_at ? new Date(row.next_review_at) : new Date();
  return {
    nextReviewAt: next,
    newInterval: row.interval_days,
    learningStep: row.learning_step,
    intervalDays: row.interval_days,
    reason,
    isCorrect,
    known: row.learning_step >= GRADUATED,
  };
}

/**
 * The shared read-schedule-write of a word or phrase review.
 *
 * The write is a compare-and-set on last_reviewed_at (see updateWordSRS): two
 * requests that read the same state can't both advance it — a double POST, or
 * a slow request racing a retry. The loser re-reads and reports 'conflict'
 * with the state that won.
 */
async function recordSrs(args: {
  userId: string;
  rating: Rating;
  source: ReviewSource;
  presentation?: number;
  direction?: 'recognition' | 'production';
  load: () => Promise<SrsRow>;
  write: (row: SrsRow, w: SrsWrite) => Promise<boolean>;
  event: Record<string, unknown>;
}): Promise<RecordedReview> {
  const { userId, rating, source, presentation } = args;
  const row = await args.load();
  const now = new Date();

  const r = schedule({
    rating,
    source,
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    learningStep: row.learning_step,
    lapses: row.lapses,
    lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at) : null,
    nextReviewAt: row.next_review_at ? new Date(row.next_review_at) : null,
    now,
    tripDate: row.trip_date,
  });

  const advance = r.reason !== 'practice_no_advance';
  const applied = await args.write(row, {
    advance,
    easeFactor: r.easeFactor,
    intervalDays: r.intervalDays,
    learningStep: r.learningStep,
    lapses: r.lapses,
    nextReviewAt: r.nextReviewAt,
    // Status reads the uncapped interval so a trip cap never demotes "mastered".
    status: calculateStatus(r.statusIntervalDays),
    isCorrect: r.isCorrect,
    // Repeat presentations of one item in a sitting are practice, not new
    // attempts: they must not inflate the hit rate.
    countAttempt: presentation == null || presentation === 1,
    direction: args.direction,
    lastReviewedAt: now,
    expectedLastReviewedAt: row.last_reviewed_token,
  });

  if (!applied) {
    const current = await args.load();
    return recorded(current, 'conflict', r.isCorrect);
  }

  emitReviewEvent(
    userId,
    {
      ...args.event,
      rating,
      source,
      presentation: presentation ?? null,
      reason: r.reason,
      priorIntervalDays: row.interval_days,
      daysAway: daysAway(row.last_reviewed_at, now),
      priorEase: row.ease_factor,
      priorLearningStep: row.learning_step,
      newIntervalDays: r.intervalDays,
      newEase: r.easeFactor,
      newLearningStep: r.learningStep,
      lapses: r.lapses,
      timesReviewed: row.times_reviewed,
      isLeech: r.isLeech,
      easePenalized: r.penalized,
    },
    now
  );

  // Update streak (fire-and-forget — don't block learning flow)
  updateUserStreak(userId).catch(() => {});

  return {
    nextReviewAt: r.nextReviewAt,
    newInterval: r.intervalDays,
    learningStep: r.learningStep,
    intervalDays: r.intervalDays,
    reason: r.reason,
    isCorrect: r.isCorrect,
    known: r.learningStep >= GRADUATED,
  };
}

export async function recordReview(
  userId: string,
  wordId: string,
  direction: 'recognition' | 'production',
  rating: Rating,
  source: ReviewSource = 'scene',
  presentation?: number
): Promise<RecordedReview> {
  // recordIntroduction is the single owner of daily_usage.words_learned and is
  // idempotent, so a word counts exactly once regardless of where the learner
  // first met it (IntroduceBatch, review, or the tutor). It must run BEFORE
  // getOrCreateUserWord, which would otherwise create the row and make the
  // introduction look like a repeat.
  await recordIntroduction(userId, wordId);
  return recordSrs({
    userId,
    rating,
    source,
    presentation,
    direction,
    load: () => getOrCreateUserWord(userId, wordId, null),
    write: (row, w) => updateWordSRS(row.id, w),
    event: { kind: 'word', wordId, direction },
  });
}

export async function getDuePhrases(
  userId: string,
  limit?: number,
  languageId?: string | null
): Promise<DuePhraseForReview[]> {
  return getDuePhrasesForReview(userId, limit ?? 20, languageId);
}

export async function recordPhraseReview(
  userId: string,
  phraseId: string,
  rating: Rating,
  source: ReviewSource = 'scene',
  direction?: 'recognition' | 'production',
  presentation?: number
): Promise<RecordedReview> {
  return recordSrs({
    userId,
    rating,
    source,
    presentation,
    direction,
    load: () => getOrCreateUserPhrase(userId, phraseId),
    write: (row, w) => updatePhraseSRS(row.id, w),
    event: { kind: 'phrase', phraseId, direction: direction ?? null },
  });
}
