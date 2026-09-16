import { describe, expect, it, vi } from 'vitest';

// engine.ts pulls the Neon client in at module load through the query
// modules. schedule() is pure, so stub the database layer out entirely.
vi.mock('@/lib/db/queries', () => ({}));
vi.mock('@/lib/db/scene-flow-queries', () => ({}));
vi.mock('@/lib/db/client', () => ({ sql: () => Promise.resolve([]) }));

import { schedule, LEECH_LAPSES, LEECH_MAX_INTERVAL_DAYS, type ScheduleInput } from './engine';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-09-16T00:00:00Z');

function graduated(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  const intervalDays = overrides.intervalDays ?? 6;
  return {
    rating: 'got_it',
    source: 'review',
    easeFactor: 2.5,
    intervalDays,
    learningStep: 2,
    lapses: 0,
    lastReviewedAt: new Date(now.getTime() - intervalDays * DAY),
    nextReviewAt: now,
    now,
    ...overrides,
  };
}

describe('schedule — on-time reviews (unchanged behaviour)', () => {
  it('Good on time multiplies by ease', () => {
    const r = schedule(graduated());
    expect(r.reason).toBe('review_advance');
    // 6 × 2.5 = 15, fuzz is ±5% (at least ±1 day) from 4 days up.
    expect(r.intervalDays).toBeGreaterThanOrEqual(14);
    expect(r.intervalDays).toBeLessThanOrEqual(16);
    expect(r.easeFactor).toBe(2.5);
  });

  it('Hard on time barely advances and costs ease', () => {
    const r = schedule(graduated({ rating: 'hard', intervalDays: 10 }));
    expect(r.intervalDays).toBeGreaterThanOrEqual(11);
    expect(r.intervalDays).toBeLessThanOrEqual(13);
    expect(r.easeFactor).toBeCloseTo(2.35);
  });

  it('a scene answer never lengthens the schedule', () => {
    const r = schedule(graduated({ source: 'scene' }));
    expect(r.reason).toBe('practice_no_advance');
    expect(r.intervalDays).toBe(6);
    expect(r.nextReviewAt).toEqual(now);
  });
});

describe('schedule — late-review credit', () => {
  it('a 6-day item remembered 111 days late is scheduled far out, not at 15 days', () => {
    const r = schedule(graduated({ intervalDays: 6, lastReviewedAt: new Date(now.getTime() - 117 * DAY) }));
    // (6 + 111/2) × 2.5 ≈ 156, before fuzz
    expect(r.intervalDays).toBeGreaterThanOrEqual(140);
    expect(r.intervalDays).toBeLessThanOrEqual(170);
  });

  it('Hard credits a quarter of the delay', () => {
    const r = schedule(graduated({ rating: 'hard', intervalDays: 6, lastReviewedAt: new Date(now.getTime() - 46 * DAY) }));
    // (6 + 40/4) × 1.2 = 19.2 → 19, ±1 fuzz
    expect(r.intervalDays).toBeGreaterThanOrEqual(18);
    expect(r.intervalDays).toBeLessThanOrEqual(20);
  });

  it('never exceeds the 365-day ceiling', () => {
    const r = schedule(graduated({ rating: 'instant', intervalDays: 100, lastReviewedAt: new Date(now.getTime() - 400 * DAY) }));
    expect(r.intervalDays).toBe(365);
  });

  it('a leech stays capped no matter how late it was', () => {
    const r = schedule(graduated({ intervalDays: 6, lapses: LEECH_LAPSES, lastReviewedAt: new Date(now.getTime() - 200 * DAY) }));
    expect(r.intervalDays).toBeLessThanOrEqual(LEECH_MAX_INTERVAL_DAYS);
    expect(r.isLeech).toBe(true);
  });
});

describe('schedule — lapses and learning steps', () => {
  it('forgetting from the review queue costs ease, keeps 30% of the interval and re-asks in 10 minutes', () => {
    const r = schedule(graduated({ rating: 'forgot', intervalDays: 20 }));
    expect(r.reason).toBe('lapse');
    expect(r.penalized).toBe(true);
    expect(r.easeFactor).toBeCloseTo(2.3);
    expect(r.intervalDays).toBe(6);
    expect(r.lapses).toBe(1);
    expect(r.learningStep).toBe(0);
    expect(r.nextReviewAt.getTime() - now.getTime()).toBe(10 * 60 * 1000);
  });

  it('forgetting inside a scene is not a lapse', () => {
    const r = schedule(graduated({ rating: 'forgot', source: 'scene', intervalDays: 20 }));
    expect(r.penalized).toBe(false);
    expect(r.easeFactor).toBe(2.5);
    expect(r.lapses).toBe(0);
    expect(r.intervalDays).toBe(20);
  });

  it('graduates by rating: hard 1d, good 3d, easy 5d', () => {
    const base = graduated({ learningStep: 1, intervalDays: 0, lastReviewedAt: null });
    expect(schedule({ ...base, rating: 'hard' }).intervalDays).toBe(1);
    expect(schedule({ ...base, rating: 'got_it' }).intervalDays).toBe(3);
    expect(schedule({ ...base, rating: 'instant' }).intervalDays).toBe(5);
    expect(schedule({ ...base, rating: 'got_it' }).reason).toBe('graduated');
  });
});
