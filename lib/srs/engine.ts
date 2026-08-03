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

function ratingToQuality(rating: Rating): number {
  switch (rating) {
    case 'instant': return 5;
    case 'got_it': return 4;
    case 'hard': return 3;
    case 'forgot': return 0;
  }
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
/** Reviews before an item can be judged a leech. */
const LEECH_MIN_REVIEWS = 8;
/** Lifetime accuracy below this, at LEECH_MIN_REVIEWS+, marks a leech. */
const LEECH_ACCURACY = 0.5;
/** A leech never schedules beyond this, so it keeps circulating. */
const LEECH_MAX_INTERVAL_DAYS = 21;

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
  timesReviewed: number;
  timesCorrect: number;
}

interface ScheduleResult {
  easeFactor: number;
  intervalDays: number;
  isCorrect: boolean;
  isLeech: boolean;
  /** True when a lapse actually cost ease (i.e. it came from the review queue). */
  penalized: boolean;
}

/**
 * SM-2 scheduling, shared by words and phrases.
 *
 * Two deliberate departures from the previous implementation:
 *
 * 1. **A lapse now costs ease** — but only when it came from the review queue.
 *    Previously `forgot` reset the interval and left the ease factor untouched,
 *    so a word could be forgotten ten times and still re-inflate 1 -> 6 -> 15 ->
 *    38 days on an unchanged EF 2.5. That is the mechanism behind the
 *    monotonically climbing overdue count. In-scene drills and tutor usage
 *    re-ask within seconds, so a miss there is a first-exposure stumble, not a
 *    failure of retention — charging ease for it would punish learning
 *    something new. Hence the `source` gate.
 *
 * 2. **Leeches stop graduating.** With no lapse column, an item is judged a
 *    leech from the counters that already exist: many reviews, poor lifetime
 *    accuracy. Those get capped rather than allowed to reach month-long gaps on
 *    a shaky ease.
 */
function schedule(input: ScheduleInput): ScheduleResult {
  const q = ratingToQuality(input.rating);
  const isCorrect = q >= 3;
  const oldEF = input.easeFactor;
  const oldInterval = input.intervalDays;

  let newEF = oldEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  let penalized = false;

  if (isCorrect) {
    if (oldInterval === 0) newInterval = 1;
    else if (oldInterval === 1) newInterval = 6;
    else newInterval = Math.round(oldInterval * newEF);
    newInterval = fuzzInterval(newInterval);
  } else {
    newInterval = 1;
    if (input.source === 'review') {
      penalized = true; // keep the SM-2 penalty computed above
    } else {
      newEF = oldEF; // first-exposure miss — reset the interval, spare the ease
    }
  }

  // Judged on the state *before* this answer, so a single good rep can't clear
  // a long history of failures.
  const isLeech =
    input.timesReviewed >= LEECH_MIN_REVIEWS &&
    input.timesCorrect / Math.max(1, input.timesReviewed) < LEECH_ACCURACY;

  if (isLeech) newInterval = Math.min(newInterval, LEECH_MAX_INTERVAL_DAYS);
  newInterval = Math.min(newInterval, MAX_INTERVAL_DAYS);

  return { easeFactor: newEF, intervalDays: newInterval, isCorrect, isLeech, penalized };
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
  const {
    easeFactor: newEF,
    intervalDays: newInterval,
    isCorrect,
    isLeech,
    penalized,
  } = schedule({
    rating,
    source,
    easeFactor: oldEF,
    intervalDays: oldInterval,
    timesReviewed: userWord.times_reviewed,
    timesCorrect: userWord.times_correct,
  });

  const now = new Date();
  const nextReviewAt = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
  const newStatus = calculateStatus(newInterval);

  await updateWordSRS(userWord.id, {
    easeFactor: newEF,
    intervalDays: newInterval,
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
    priorIntervalDays: oldInterval,
    priorEase: oldEF,
    newIntervalDays: newInterval,
    newEase: newEF,
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
  const {
    easeFactor: newEF,
    intervalDays: newInterval,
    isCorrect,
    isLeech,
    penalized,
  } = schedule({
    rating,
    source,
    easeFactor: oldEF,
    intervalDays: oldInterval,
    timesReviewed: userPhrase.times_reviewed,
    timesCorrect: userPhrase.times_correct,
  });

  const now = new Date();
  const nextReviewAt = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
  const newStatus = calculateStatus(newInterval);

  await updatePhraseSRS(userPhrase.id, {
    easeFactor: newEF,
    intervalDays: newInterval,
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
    direction: direction ?? null,
    priorIntervalDays: oldInterval,
    priorEase: oldEF,
    newIntervalDays: newInterval,
    newEase: newEF,
    timesReviewed: userPhrase.times_reviewed,
    isLeech,
    easePenalized: penalized,
  });

  updateUserStreak(userId).catch(() => {});

  return { nextReviewAt, newInterval };
}
