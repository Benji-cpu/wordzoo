import { beforeEach, describe, expect, it, vi } from 'vitest';

const q = vi.hoisted(() => ({
  getOrCreateUserWord: vi.fn(),
  updateWordSRS: vi.fn(),
  recordIntroduction: vi.fn(),
  updateUserStreak: vi.fn(),
  getDueWordsForReview: vi.fn(),
  getDueWordCount: vi.fn(),
  getOrCreateUserPhrase: vi.fn(),
  updatePhraseSRS: vi.fn(),
  getDuePhrasesForReview: vi.fn(),
  getDuePhraseCount: vi.fn(),
  sql: vi.fn(),
}));
vi.mock('@/lib/db/queries', () => q);
vi.mock('@/lib/db/scene-flow-queries', () => q);
vi.mock('@/lib/db/client', () => ({ sql: q.sql }));

import { recordReview, recordPhraseReview, getReviewSitting } from './engine';

const DAY = 86_400_000;

function row(over: Record<string, unknown> = {}) {
  const last = new Date(Date.now() - 6 * DAY);
  return {
    id: 'uw1',
    ease_factor: 2.5,
    interval_days: 6,
    learning_step: 2,
    lapses: 0,
    times_reviewed: 5,
    times_correct: 4,
    status: 'learning',
    direction: 'production',
    last_reviewed_at: last,
    last_reviewed_token: last.toISOString(),
    next_review_at: new Date(Date.now() - 1000),
    trip_date: null,
    ...over,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  q.recordIntroduction.mockResolvedValue({ alreadyIntroduced: true });
  q.updateUserStreak.mockResolvedValue(undefined);
  q.updateWordSRS.mockResolvedValue(true);
  q.updatePhraseSRS.mockResolvedValue(true);
  q.sql.mockResolvedValue([]);
});

describe('recordReview', () => {
  it('returns the contract fields and writes an advance with the compare-and-set token', async () => {
    const r0 = row();
    q.getOrCreateUserWord.mockResolvedValue(r0);
    const res = await recordReview('u', 'w', 'production', 'got_it', 'review', 1);
    expect(res.reason).toBe('review_advance');
    expect(res.known).toBe(true);
    expect(res.learningStep).toBe(2);
    expect(res.intervalDays).toBe(res.newInterval);
    expect(res.isCorrect).toBe(true);
    expect(res.nextReviewAt).toBeInstanceOf(Date);
    const w = q.updateWordSRS.mock.calls[0][1];
    expect(w.advance).toBe(true);
    expect(w.expectedLastReviewedAt).toBe(r0.last_reviewed_token);
    expect(w.countAttempt).toBe(true);
    expect(w.direction).toBe('production');
  });

  it('a lost compare-and-set re-reads and reports conflict, with no telemetry and no streak', async () => {
    q.getOrCreateUserWord.mockResolvedValueOnce(row()).mockResolvedValueOnce(row({ interval_days: 15, next_review_at: new Date(Date.now() + 15 * DAY) }));
    q.updateWordSRS.mockResolvedValue(false);
    const res = await recordReview('u', 'w', 'production', 'got_it', 'review');
    expect(res.reason).toBe('conflict');
    expect(res.intervalDays).toBe(15);
    expect(q.getOrCreateUserWord).toHaveBeenCalledTimes(2);
    expect(q.sql).not.toHaveBeenCalled();
    expect(q.updateUserStreak).not.toHaveBeenCalled();
  });

  it('a repeat presentation does not bump the counters; the first (or none) does', async () => {
    q.getOrCreateUserWord.mockResolvedValue(row());
    await recordReview('u', 'w', 'production', 'got_it', 'review', 2);
    expect(q.updateWordSRS.mock.calls[0][1].countAttempt).toBe(false);
    await recordReview('u', 'w', 'production', 'got_it', 'review', 1);
    expect(q.updateWordSRS.mock.calls[1][1].countAttempt).toBe(true);
    await recordReview('u', 'w', 'production', 'got_it', 'review');
    expect(q.updateWordSRS.mock.calls[2][1].countAttempt).toBe(true);
  });

  it('a scene answer is a counters-only write', async () => {
    q.getOrCreateUserWord.mockResolvedValue(row());
    const res = await recordReview('u', 'w', 'recognition', 'got_it', 'scene');
    expect(res.reason).toBe('practice_no_advance');
    expect(q.updateWordSRS.mock.calls[0][1].advance).toBe(false);
  });

  it('a graduated status is read from the uncapped interval under a trip', async () => {
    const trip = new Date(Date.now() + 81 * DAY).toISOString().slice(0, 10);
    q.getOrCreateUserWord.mockResolvedValue(row({ interval_days: 105, trip_date: trip, last_reviewed_at: new Date(Date.now() - 105 * DAY), next_review_at: new Date(Date.now() - 1000) }));
    const res = await recordReview('u', 'w', 'production', 'instant', 'review');
    expect(res.intervalDays).toBeLessThanOrEqual(27);
    expect(q.updateWordSRS.mock.calls[0][1].status).toBe('mastered');
  });

  it('writes the review event with presentation and an explicit created_at, even outside a request (after() throws)', async () => {
    q.getOrCreateUserWord.mockResolvedValue(row());
    await recordReview('u', 'w', 'production', 'got_it', 'review', 2);
    await Promise.resolve();
    expect(q.sql).toHaveBeenCalledTimes(1);
    const values = q.sql.mock.calls[0].slice(1);
    const payload = JSON.parse(values[1] as string);
    expect(payload.presentation).toBe(2);
    expect(payload.source).toBe('review');
    expect(payload.priorLearningStep).toBe(2);
    expect(typeof values[2]).toBe('string');
  });
});

describe('recordPhraseReview', () => {
  it('passes direction and presentation through', async () => {
    q.getOrCreateUserPhrase.mockResolvedValue(row({ id: 'up1' }));
    const res = await recordPhraseReview('u', 'p', 'hard', 'review', 'production', 3);
    expect(res.reason).toBe('review_advance');
    const w = q.updatePhraseSRS.mock.calls[0][1];
    expect(w.direction).toBe('production');
    expect(w.countAttempt).toBe(false);
  });
});

describe('getReviewSitting', () => {
  const words = (n: number, interval = 1) => Array.from({ length: n }, (_, i) => ({ word_id: `w${i}`, interval_days: interval }));
  const phrases = (n: number) => Array.from({ length: n }, (_, i) => ({ phrase_id: `p${i}`, interval_days: 1 }));

  it('with a small backlog asks only for the standard order and passes the priority scene', async () => {
    q.getDueWordCount.mockResolvedValue(10);
    q.getDuePhraseCount.mockResolvedValue(3);
    q.getDueWordsForReview.mockResolvedValue(words(10));
    q.getDuePhrasesForReview.mockResolvedValue(phrases(3));
    const s = await getReviewSitting('u', 'lang', { priorityScene: 'scene1' });
    expect(q.getDueWordsForReview).toHaveBeenCalledTimes(1);
    expect(q.getDueWordsForReview).toHaveBeenCalledWith('u', 14, 'lang', { priorityScene: 'scene1' });
    expect(s.words).toHaveLength(10);
    expect(s.phrases).toHaveLength(3);
    expect(s.dueWordTotal).toBe(10);
    expect(s.duePhraseTotal).toBe(3);
  });

  it('with more than 40 due, also fetches the most overdue mature items and mixes them in', async () => {
    q.getDueWordCount.mockResolvedValue(80);
    q.getDuePhraseCount.mockResolvedValue(20);
    q.getDueWordsForReview.mockImplementation(async (_u: string, limit: number, _l: unknown, opts: { matureOverdue?: boolean }) =>
      opts?.matureOverdue
        ? Array.from({ length: limit }, (_, i) => ({ word_id: `m${i}`, interval_days: 20 }))
        : words(limit)
    );
    q.getDuePhrasesForReview.mockResolvedValue(phrases(8));
    const s = await getReviewSitting('u', null);
    expect(s.words).toHaveLength(14);
    expect(s.words.filter((w) => w.word_id.startsWith('m'))).toHaveLength(4);
    expect(q.getDueWordsForReview).toHaveBeenCalledWith('u', 4, null, { matureOverdue: true });
  });
});
