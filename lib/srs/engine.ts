import { getDueWordsForReview, getOrCreateUserWord, updateWordSRS, updateUserStreak, incrementDailyUsageWordsLearned } from '@/lib/db/queries';
import type { DueWordForReview } from '@/lib/db/queries';
import { getOrCreateUserPhrase, updatePhraseSRS, getDuePhrasesForReview } from '@/lib/db/scene-flow-queries';
import type { DuePhraseForReview } from '@/lib/db/scene-flow-queries';

type Rating = 'instant' | 'got_it' | 'hard' | 'forgot';

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
  rating: Rating
): Promise<{ nextReviewAt: Date; newInterval: number }> {
  const userWord = await getOrCreateUserWord(userId, wordId, null);

  // First-ever review = word just "learned" — track for pacing + free-tier limits
  if (userWord.times_reviewed === 0) {
    const today = new Date().toISOString().split('T')[0];
    incrementDailyUsageWordsLearned(userId, today, 1).catch(() => {});
  }

  const q = ratingToQuality(rating);
  const oldEF = userWord.ease_factor;
  const oldInterval = userWord.interval_days;
  const isCorrect = q >= 3;

  // SM-2 ease factor calculation
  let newEF = oldEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  // Interval calculation
  let newInterval: number;
  if (isCorrect) {
    if (oldInterval === 0) {
      newInterval = 1;
    } else if (oldInterval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(oldInterval * newEF);
    }
  } else {
    // Forgot: reset interval, keep ease factor unchanged
    newInterval = 1;
    newEF = oldEF;
  }

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
  rating: Rating
): Promise<{ nextReviewAt: Date; newInterval: number }> {
  const userPhrase = await getOrCreateUserPhrase(userId, phraseId);

  const q = ratingToQuality(rating);
  const oldEF = userPhrase.ease_factor;
  const oldInterval = userPhrase.interval_days;
  const isCorrect = q >= 3;

  let newEF = oldEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  if (isCorrect) {
    if (oldInterval === 0) newInterval = 1;
    else if (oldInterval === 1) newInterval = 6;
    else newInterval = Math.round(oldInterval * newEF);
  } else {
    newInterval = 1;
    newEF = oldEF;
  }

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
    lastReviewedAt: now,
  });

  updateUserStreak(userId).catch(() => {});

  return { nextReviewAt, newInterval };
}
