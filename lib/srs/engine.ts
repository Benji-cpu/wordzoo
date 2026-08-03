import { getDueWordsForReview, getOrCreateUserWord, updateWordSRS, updateUserStreak, recordIntroduction } from '@/lib/db/queries';
import type { DueWordForReview } from '@/lib/db/queries';
import { getOrCreateUserPhrase, updatePhraseSRS, getDuePhrasesForReview } from '@/lib/db/scene-flow-queries';
import type { DuePhraseForReview } from '@/lib/db/scene-flow-queries';
import { sql } from '@/lib/db/client';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';

/**
 * Where the review came from. See ReviewSourceEnum in types/api.ts for why this
 * matters: only 'review' is genuine delayed retrieval.
 */
export type ReviewSource = 'review' | 'scene' | 'tutor';

/**
 * Emit one row per scheduled review so retention can be bucketed by the
 * interval the review actually happened at.
 *
 * This is written server-side rather than through /api/telemetry/pedagogy
 * because the engine already holds userId and the pre-update SRS state, and
 * because the HTTP route's event field is free-form. Fire-and-forget: a
 * telemetry failure must never fail a learner's review.
 */
function emitReviewEvent(userId: string, payload: Record<string, unknown>): void {
  void sql`
    INSERT INTO pedagogy_events (user_id, event, payload)
    VALUES (${userId}, 'srs_review_recorded', ${JSON.stringify(payload)}::jsonb)
  `.catch(() => {});
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

/**
 * Sources whose answers may LENGTHEN the schedule.
 *
 * In-scene drills and tutor turns re-ask within seconds of showing the answer,
 * so a correct response there is working memory, not retrieval. Letting them
 * advance the interval is what produced 105-day schedules on 62-day-old rows —
 * five taps in one sitting multiplied the interval five times.
 */
const ADVANCING_SOURCES: ReadonlySet<ReviewSource> = new Set<ReviewSource>(['review']);

/** How long a brand-new or freshly-lapsed item waits before its first re-ask. */
const LEARNING_STEP_MINUTES = 10;
/** learning_step value meaning "out of the learning phase, on a real interval". */
const GRADUATED = 2;

/**
 * The interval an item graduates to, chosen by the rating that graduated it.
 *
 * This is what finally makes the four rating buttons mean four things. The old
 * ladder was a flat 0 -> 1 -> 6 regardless of rating, so "Hard", "Good" and
 * "Easy" produced identical schedules for a word's first two reviews.
 */
const GRADUATING_INTERVAL_DAYS: Record<'hard' | 'got_it' | 'instant', number> = {
  hard: 1,
  got_it: 3,
  instant: 5,
};

/** Explicit ease deltas. Clearer than SM-2's polynomial, and lets a lapse cost
 *  a survivable 0.20 rather than SM-2's punitive 0.80. */
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
/** A lapse keeps some of the earned interval rather than resetting to zero. */
const LAPSE_INTERVAL_MULTIPLIER = 0.3;

/**
 * Spread an interval by ±5% (at least ±1 day) so a batch of words learned in
 * one sitting doesn't all come due on the same future day.
 *
 * Without this, every scene's vocabulary returns as a single lump — which is
 * what made `overdueReviews` climb in steps rather than drain smoothly, and
 * what makes a missed day feel unrecoverable.
 */
function fuzzInterval(days: number): number {
  if (days < FUZZ_FROM_DAYS) return days;
  const spread = Math.max(1, Math.round(days * 0.05));
  const offset = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
  return Math.max(FUZZ_FROM_DAYS, days + offset);
}

interface ScheduleInput {
  rating: Rating;
  /** Only 'review' is genuine delayed retrieval — see ReviewSource. */
  source: ReviewSource;
  easeFactor: number;
  intervalDays: number;
  /** 0 = awaiting the 10-min step, 1 = awaiting graduation, 2 = graduated. */
  learningStep: number;
  lapses: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  now: Date;
}

/** Why the schedule moved (or didn't). Recorded on every review event so the
 *  digest can prove in-scene answers stopped inflating the schedule. */
type ScheduleReason =
  | 'learning_step'
  | 'graduated'
  | 'review_advance'
  | 'lapse'
  | 'practice_no_advance';

interface ScheduleResult {
  easeFactor: number;
  intervalDays: number;
  learningStep: number;
  lapses: number;
  nextReviewAt: Date;
  isCorrect: boolean;
  isLeech: boolean;
  /** True when a lapse actually cost ease (i.e. it came from the review queue). */
  penalized: boolean;
  reason: ScheduleReason;
}

function clampEase(ef: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, ef));
}

function daysFromNow(now: Date, days: number): Date {
  return new Date(now.getTime() + days * DAY_MS);
}

/**
 * SM-2-derived scheduling, shared by words and phrases.
 *
 * The governing rule, and the reason this looks stricter than a textbook SM-2:
 *
 *   **In-session evidence can only ever make the schedule tighter, never
 *   looser.**
 *
 * Three departures from a plain SM-2:
 *
 * 1. **Only the review queue advances the interval.** An in-scene drill shows
 *    the answer and re-asks seconds later; a correct response is working
 *    memory, not retrieval. Previously every drill tap multiplied the interval,
 *    which is how `saya` reached 9,300 days and how four Portuguese words
 *    reached a 105-day interval on 62-day-old rows — scheduled further out than
 *    the learner had known them. Answering *early* is treated the same way: the
 *    forgetting curve hasn't been tested yet, so practice never lengthens.
 *    A miss from any source still counts, because tightening is always safe.
 *
 * 2. **A lapse costs ease**, but only from the review queue. Forgetting used to
 *    be free — the interval reset to 1 and the ease factor was untouched, so a
 *    word forgotten ten times kept EF 2.5 and re-inflated. That is the
 *    mechanism behind the monotonically climbing overdue count.
 *
 * 3. **One 10-minute learning step, and rating-dependent graduation.** The old
 *    ladder was a flat 0 -> 1 -> 6, so "Hard", "Good" and "Easy" produced
 *    identical schedules on a word's first two reviews. `interval_days` is an
 *    INTEGER and cannot express "10 minutes", so it now means strictly *the
 *    graduated interval*, `learning_step` carries the pre-graduation state, and
 *    `next_review_at` (already TIMESTAMPTZ) does the actual timing.
 */
function schedule(input: ScheduleInput): ScheduleResult {
  const { rating, source, now } = input;
  const isCorrect = rating !== 'forgot';
  const oldEF = input.easeFactor;
  const oldInterval = input.intervalDays;
  const oldStep = input.learningStep;
  const wasGraduated = oldStep >= GRADUATED;

  // --- Failure: reset to the learning step and re-ask in 10 minutes. ---
  if (!isCorrect) {
    // Only a genuine delayed retrieval failure is a lapse. A stumble on a word
    // the learner met sixty seconds ago is not evidence of forgetting.
    const isRealLapse = ADVANCING_SOURCES.has(source);
    const newEF = isRealLapse ? clampEase(oldEF + EASE_DELTA.forgot) : oldEF;
    const lapses = input.lapses + (isRealLapse && wasGraduated ? 1 : 0);
    const newInterval =
      isRealLapse && wasGraduated
        ? Math.max(1, Math.round(oldInterval * LAPSE_INTERVAL_MULTIPLIER))
        : oldInterval;

    return {
      easeFactor: newEF,
      intervalDays: newInterval,
      learningStep: 0,
      lapses,
      nextReviewAt: new Date(now.getTime() + LEARNING_STEP_MINUTES * 60 * 1000),
      isCorrect: false,
      isLeech: lapses >= LEECH_LAPSES,
      penalized: isRealLapse,
      reason: 'lapse',
    };
  }

  // --- Correct, but not from a source that may lengthen the schedule. ---
  // Record the attempt (the caller still bumps the counters) and leave the
  // schedule exactly where it was, including next_review_at: practising a word
  // in a scene must not clear it from the review queue.
  const isDue = oldInterval === 0 || !input.lastReviewedAt
    ? true
    : Math.floor((now.getTime() - input.lastReviewedAt.getTime()) / DAY_MS) >= oldInterval;

  if (!ADVANCING_SOURCES.has(source) || !isDue) {
    return {
      easeFactor: oldEF,
      intervalDays: oldInterval,
      learningStep: oldStep,
      lapses: input.lapses,
      nextReviewAt: input.nextReviewAt ?? now,
      isCorrect: true,
      isLeech: input.lapses >= LEECH_LAPSES,
      penalized: false,
      reason: 'practice_no_advance',
    };
  }

  const newEF = clampEase(oldEF + EASE_DELTA[rating]);

  // --- Still in the learning phase. ---
  if (!wasGraduated) {
    if (oldStep === 0) {
      return {
        easeFactor: newEF,
        intervalDays: oldInterval,
        learningStep: 1,
        lapses: input.lapses,
        nextReviewAt: new Date(now.getTime() + LEARNING_STEP_MINUTES * 60 * 1000),
        isCorrect: true,
        isLeech: input.lapses >= LEECH_LAPSES,
        penalized: false,
        reason: 'learning_step',
      };
    }

    // Step 1 -> graduate. An item relearning after a lapse already carries a
    // reduced interval; return it to that rather than restarting the ladder.
    const graduated =
      oldInterval > 0
        ? oldInterval
        : GRADUATING_INTERVAL_DAYS[rating as 'hard' | 'got_it' | 'instant'];
    const capped = applyCaps(graduated, input.lapses);
    return {
      easeFactor: newEF,
      intervalDays: capped,
      learningStep: GRADUATED,
      lapses: input.lapses,
      nextReviewAt: daysFromNow(now, capped),
      isCorrect: true,
      isLeech: input.lapses >= LEECH_LAPSES,
      penalized: false,
      reason: 'graduated',
    };
  }

  // --- Graduated: a real spaced-retrieval success. ---
  let advanced: number;
  if (rating === 'hard') {
    advanced = Math.max(1, Math.round(oldInterval * HARD_INTERVAL_MULTIPLIER));
  } else if (rating === 'instant') {
    advanced = Math.max(oldInterval + 1, Math.round(oldInterval * newEF * EASY_INTERVAL_BONUS));
  } else {
    advanced = Math.max(oldInterval + 1, Math.round(oldInterval * newEF));
  }

  const capped = applyCaps(fuzzInterval(advanced), input.lapses);
  return {
    easeFactor: newEF,
    intervalDays: capped,
    learningStep: GRADUATED,
    lapses: input.lapses,
    nextReviewAt: daysFromNow(now, capped),
    isCorrect: true,
    isLeech: input.lapses >= LEECH_LAPSES,
    penalized: false,
    reason: 'review_advance',
  };
}

/** Leech cap first, then the absolute ceiling. */
function applyCaps(days: number, lapses: number): number {
  const leechCapped = lapses >= LEECH_LAPSES ? Math.min(days, LEECH_MAX_INTERVAL_DAYS) : days;
  return Math.min(leechCapped, MAX_INTERVAL_DAYS);
}

export async function getDueWords(
  userId: string,
  limit?: number,
  _context?: string,
  languageId?: string | null
): Promise<DueWordForReview[]> {
  return getDueWordsForReview(userId, limit ?? 20, languageId);
}

export async function recordReview(
  userId: string,
  wordId: string,
  direction: 'recognition' | 'production',
  rating: Rating,
  source: ReviewSource = 'scene'
): Promise<{ nextReviewAt: Date; newInterval: number }> {
  // recordIntroduction is the single owner of daily_usage.words_learned and is
  // idempotent, so a word counts exactly once regardless of where the learner
  // first met it (IntroduceBatch, review, or the tutor).
  //
  // This used to be `if (userWord.times_reviewed === 0) increment...`, which
  // double-counted: recordIntroduction (fired by IntroduceBatch) creates the
  // user_words row with times_reviewed = 0, so the very next drill answer
  // counted the same word a second time — quietly halving the free tier from
  // 5 words/day to 2.5. It must run BEFORE getOrCreateUserWord, which would
  // otherwise create the row and make the introduction look like a repeat.
  await recordIntroduction(userId, wordId);
  const userWord = await getOrCreateUserWord(userId, wordId, null);

  const oldEF = userWord.ease_factor;
  const oldInterval = userWord.interval_days;
  const now = new Date();
  const {
    easeFactor: newEF,
    intervalDays: newInterval,
    learningStep,
    lapses,
    nextReviewAt,
    isCorrect,
    isLeech,
    penalized,
    reason,
  } = schedule({
    rating,
    source,
    easeFactor: oldEF,
    intervalDays: oldInterval,
    learningStep: userWord.learning_step,
    lapses: userWord.lapses,
    lastReviewedAt: userWord.last_reviewed_at,
    nextReviewAt: userWord.next_review_at,
    now,
  });

  const newStatus = calculateStatus(newInterval);

  await updateWordSRS(userWord.id, {
    easeFactor: newEF,
    intervalDays: newInterval,
    learningStep,
    lapses,
    nextReviewAt,
    timesReviewed: userWord.times_reviewed + 1,
    timesCorrect: userWord.times_correct + (isCorrect ? 1 : 0),
    status: newStatus,
    direction,
    lastReviewedAt: now,
  });

  emitReviewEvent(userId, {
    kind: 'word',
    wordId,
    direction,
    rating,
    source,
    reason,
    priorIntervalDays: oldInterval,
    priorEase: oldEF,
    priorLearningStep: userWord.learning_step,
    newIntervalDays: newInterval,
    newEase: newEF,
    newLearningStep: learningStep,
    lapses,
    timesReviewed: userWord.times_reviewed,
    isLeech,
    easePenalized: penalized,
  });

  // Update streak (fire-and-forget — don't block learning flow)
  updateUserStreak(userId).catch(() => {});

  return { nextReviewAt, newInterval };
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
  direction?: 'recognition' | 'production'
): Promise<{ nextReviewAt: Date; newInterval: number }> {
  const userPhrase = await getOrCreateUserPhrase(userId, phraseId);

  const oldEF = userPhrase.ease_factor;
  const oldInterval = userPhrase.interval_days;
  const now = new Date();
  const {
    easeFactor: newEF,
    intervalDays: newInterval,
    learningStep,
    lapses,
    nextReviewAt,
    isCorrect,
    isLeech,
    penalized,
    reason,
  } = schedule({
    rating,
    source,
    easeFactor: oldEF,
    intervalDays: oldInterval,
    learningStep: userPhrase.learning_step,
    lapses: userPhrase.lapses,
    lastReviewedAt: userPhrase.last_reviewed_at,
    nextReviewAt: userPhrase.next_review_at,
    now,
  });

  const newStatus = calculateStatus(newInterval);

  await updatePhraseSRS(userPhrase.id, {
    easeFactor: newEF,
    intervalDays: newInterval,
    learningStep,
    lapses,
    nextReviewAt,
    timesReviewed: userPhrase.times_reviewed + 1,
    timesCorrect: userPhrase.times_correct + (isCorrect ? 1 : 0),
    status: newStatus,
    direction,
    lastReviewedAt: now,
  });

  emitReviewEvent(userId, {
    kind: 'phrase',
    phraseId,
    rating,
    source,
    reason,
    direction: direction ?? null,
    priorIntervalDays: oldInterval,
    priorEase: oldEF,
    priorLearningStep: userPhrase.learning_step,
    newIntervalDays: newInterval,
    newEase: newEF,
    newLearningStep: learningStep,
    lapses,
    timesReviewed: userPhrase.times_reviewed,
    isLeech,
    easePenalized: penalized,
  });

  updateUserStreak(userId).catch(() => {});

  return { nextReviewAt, newInterval };
}
