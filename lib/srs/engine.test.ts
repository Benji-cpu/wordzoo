import { describe, expect, it, vi } from 'vitest';

// engine.ts pulls the Neon client in at module load through the query
// modules. schedule() is pure, so stub the database layer out entirely.
vi.mock('@/lib/db/queries', () => ({}));
vi.mock('@/lib/db/scene-flow-queries', () => ({}));
vi.mock('@/lib/db/client', () => ({ sql: () => Promise.resolve([]) }));

import {
  schedule,
  daysAway,
  isDue,
  LEECH_LAPSES,
  LEECH_MAX_INTERVAL_DAYS,
  type ScheduleInput,
  type ScheduleResult,
} from './engine';
import { tripIntervalCap } from './trip';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-09-16T00:00:00Z');
/** 0.5 makes fuzz and trip spread deterministic (fuzz offset 0). */
const mid = () => 0.5;

/** A graduated item that comes due exactly now: next = last + interval. */
function graduated(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  const intervalDays = overrides.intervalDays ?? 6;
  const lastReviewedAt = overrides.lastReviewedAt ?? new Date(now.getTime() - intervalDays * DAY);
  return {
    rating: 'got_it',
    source: 'review',
    easeFactor: 2.5,
    intervalDays,
    learningStep: 2,
    lapses: 0,
    lastReviewedAt,
    nextReviewAt: new Date(lastReviewedAt.getTime() + intervalDays * DAY),
    now,
    rand: mid,
    ...overrides,
  };
}

/** A brand-new item, never reviewed. */
function fresh(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  return {
    rating: 'got_it',
    source: 'review',
    easeFactor: 2.5,
    intervalDays: 0,
    learningStep: 0,
    lapses: 0,
    lastReviewedAt: null,
    nextReviewAt: now,
    now,
    rand: mid,
    ...overrides,
  };
}

/** Feed a result back in as the next input, `afterMs` later. */
function next(r: ScheduleResult, prev: ScheduleInput, over: Partial<ScheduleInput> = {}, afterMs = 60_000): ScheduleInput {
  const at = new Date(prev.now.getTime() + afterMs);
  return {
    ...prev,
    easeFactor: r.easeFactor,
    intervalDays: r.intervalDays,
    learningStep: r.learningStep,
    lapses: r.lapses,
    lastReviewedAt: prev.now,
    nextReviewAt: r.nextReviewAt,
    now: at,
    ...over,
  };
}

describe('schedule — on-time reviews', () => {
  it('Good on time multiplies by ease', () => {
    const r = schedule(graduated());
    expect(r.reason).toBe('review_advance');
    expect(r.intervalDays).toBe(15);
    expect(r.easeFactor).toBe(2.5);
    expect(r.nextReviewAt.getTime()).toBe(now.getTime() + 15 * DAY);
  });

  it('Hard on time barely advances and costs ease', () => {
    const r = schedule(graduated({ rating: 'hard', intervalDays: 10 }));
    expect(r.intervalDays).toBe(12);
    expect(r.easeFactor).toBeCloseTo(2.35);
  });

  it('Easy on time gets the bonus and the ease', () => {
    const r = schedule(graduated({ rating: 'instant', intervalDays: 10 }));
    // 10 × 2.6 × 1.3 = 33.8
    expect(r.intervalDays).toBe(34);
    expect(r.easeFactor).toBeCloseTo(2.6);
  });

  it('a scene answer never lengthens the schedule', () => {
    const r = schedule(graduated({ source: 'scene' }));
    expect(r.reason).toBe('practice_no_advance');
    expect(r.intervalDays).toBe(6);
    expect(r.nextReviewAt).toEqual(now);
  });
});

describe('schedule — due is decided by nextReviewAt (1, 2, 3)', () => {
  it('advances a due item even when a scene touch just moved lastReviewedAt', () => {
    const r = schedule(
      graduated({ lastReviewedAt: now, nextReviewAt: new Date(now.getTime() - 3 * DAY) })
    );
    expect(r.reason).toBe('review_advance');
    // credited = min(3, 6) = 3 → (6 + 1.5) × 2.5 = 18.75
    expect(r.intervalDays).toBe(19);
  });

  it('a not-due item does not advance and its schedule is untouched', () => {
    const nextReviewAt = new Date(now.getTime() + 5 * DAY);
    const r = schedule(graduated({ nextReviewAt }));
    expect(r.reason).toBe('practice_no_advance');
    expect(r.intervalDays).toBe(6);
    expect(r.learningStep).toBe(2);
    expect(r.nextReviewAt).toEqual(nextReviewAt);
    expect(r.easeFactor).toBe(2.5);
  });

  it('30 s tolerance: +30 s advances, +31 s does not, null is due', () => {
    const at = (s: number) => graduated({ nextReviewAt: new Date(now.getTime() + s * 1000) });
    expect(schedule(at(30)).reason).toBe('review_advance');
    expect(schedule(at(31)).reason).toBe('practice_no_advance');
    expect(schedule(graduated({ nextReviewAt: null })).reason).toBe('review_advance');
    expect(isDue(null, now)).toBe(true);
  });
});

describe('schedule — learning phase (4, 5, 6)', () => {
  it('a new item graduates by rating: got_it 1 d, instant 3 d, hard stays learning', () => {
    const g = schedule(fresh());
    expect(g.reason).toBe('graduated');
    expect(g.learningStep).toBe(2);
    expect(g.intervalDays).toBe(1);
    expect(g.nextReviewAt.getTime()).toBe(now.getTime() + DAY);

    expect(schedule(fresh({ rating: 'instant' })).intervalDays).toBe(3);

    const h = schedule(fresh({ rating: 'hard' }));
    expect(h.reason).toBe('learning_step');
    expect(h.learningStep).toBe(0);
    expect(h.nextReviewAt).toEqual(now);
    expect(h.easeFactor).toBe(2.5);
    expect(h.lapses).toBe(0);
    expect(h.isCorrect).toBe(true);
  });

  it('the 15 s floor: a learning item re-asked 5 s later does not advance, 16 s later does', () => {
    const r5 = schedule(fresh({ lastReviewedAt: new Date(now.getTime() - 5_000) }));
    expect(r5.reason).toBe('practice_no_advance');
    expect(r5.learningStep).toBe(0);
    const r16 = schedule(fresh({ lastReviewedAt: new Date(now.getTime() - 16_000) }));
    expect(r16.reason).toBe('graduated');
  });

  it('two identical got_it posts 300 ms apart graduate once', () => {
    const first = schedule(fresh());
    expect(first.reason).toBe('graduated');
    const second = schedule(next(first, fresh(), {}, 300));
    expect(second.reason).toBe('practice_no_advance');
    expect(second.intervalDays).toBe(1);
    expect(second.nextReviewAt).toEqual(first.nextReviewAt);
  });

  it('review misses at step 0 change neither ease nor lapses; three misses then got_it leave ease alone', () => {
    let input = fresh({ lastReviewedAt: new Date(now.getTime() - 60_000) });
    for (let i = 0; i < 3; i++) {
      const r = schedule({ ...input, rating: 'forgot' });
      expect(r.reason).toBe('lapse');
      expect(r.learningStep).toBe(0);
      expect(r.nextReviewAt).toEqual(input.now);
      expect(r.easeFactor).toBe(2.5);
      expect(r.lapses).toBe(0);
      expect(r.penalized).toBe(false);
      input = next(r, { ...input, rating: 'forgot' });
    }
    const ok = schedule({ ...input, rating: 'got_it' });
    expect(ok.reason).toBe('graduated');
    expect(ok.easeFactor).toBe(2.5);
    expect(ok.lapses).toBe(0);
  });
});

describe('schedule — lapses (7, 8)', () => {
  it('forgetting a due graduated item from review is a real lapse', () => {
    const r = schedule(graduated({ rating: 'forgot', intervalDays: 20 }));
    expect(r.reason).toBe('lapse');
    expect(r.penalized).toBe(true);
    expect(r.easeFactor).toBeCloseTo(2.3);
    expect(r.intervalDays).toBe(6);
    expect(r.lapses).toBe(1);
    expect(r.learningStep).toBe(0);
    expect(r.nextReviewAt).toEqual(now);
  });

  it('a lapsed item relearns at its reduced interval: 20 → 6, got_it graduates at 6', () => {
    const lapseInput = graduated({ rating: 'forgot', intervalDays: 20 });
    const lapse = schedule(lapseInput);
    const back = schedule(next(lapse, { ...lapseInput, rating: 'got_it' }));
    expect(back.reason).toBe('graduated');
    expect(back.learningStep).toBe(2);
    expect(back.intervalDays).toBe(6);
    // ease was cost at the lapse, not again on the way back
    expect(back.easeFactor).toBeCloseTo(2.3);
  });

  it('relearning under a close trip graduates at the cap or clamp, not the old interval', () => {
    const lapseInput = graduated({ rating: 'forgot', intervalDays: 20 });
    const lapse = schedule(lapseInput);
    // 8 days left: nothing may come due after day 5.
    const back = schedule(next(lapse, { ...lapseInput, rating: 'got_it', tripDate: '2026-09-24' }));
    expect(back.learningStep).toBe(2);
    expect(back.intervalDays).toBeLessThanOrEqual(5);
    expect(back.intervalDays).toBeGreaterThanOrEqual(1);
    expect(back.statusIntervalDays).toBe(6);
  });
});

describe('schedule — other misses only tighten (9, 10, 11)', () => {
  for (const source of ['scene', 'tutor', 'practice'] as const) {
    it(`a ${source} miss on a graduated item: no lapse, no ease cost, interval shrinks to 30%`, () => {
      const r = schedule(graduated({ rating: 'forgot', source, intervalDays: 20 }));
      expect(r.reason).toBe('lapse');
      expect(r.penalized).toBe(false);
      expect(r.easeFactor).toBe(2.5);
      expect(r.lapses).toBe(0);
      expect(r.intervalDays).toBe(6);
      expect(r.learningStep).toBe(0);
      expect(r.nextReviewAt).toEqual(now);
    });
  }

  it('a review miss on a graduated item that is not due is not a lapse', () => {
    const r = schedule(
      graduated({ rating: 'forgot', intervalDays: 20, nextReviewAt: new Date(now.getTime() + 5 * DAY) })
    );
    expect(r.penalized).toBe(false);
    expect(r.lapses).toBe(0);
    expect(r.easeFactor).toBe(2.5);
    expect(r.intervalDays).toBe(6);
  });

  it('practice: a correct answer on a due graduated item does not advance; a miss is not penalised', () => {
    const ok = schedule(graduated({ source: 'practice' }));
    expect(ok.reason).toBe('practice_no_advance');
    expect(ok.intervalDays).toBe(6);
    const miss = schedule(graduated({ source: 'practice', rating: 'forgot' }));
    expect(miss.penalized).toBe(false);
    expect(miss.lapses).toBe(0);
  });
});

describe('schedule — late-review credit (12)', () => {
  it('a 6-day item remembered 111 days late is credited at most its own interval', () => {
    const r = schedule(graduated({ intervalDays: 6, lastReviewedAt: new Date(now.getTime() - 117 * DAY) }));
    // credited = min(111, 6) = 6 → (6 + 3) × 2.5 = 22.5
    expect(r.intervalDays).toBe(23);
  });

  it('Hard credits a quarter of the (capped) delay', () => {
    const r = schedule(graduated({ rating: 'hard', intervalDays: 6, lastReviewedAt: new Date(now.getTime() - 117 * DAY) }));
    // (6 + 6/4) × 1.2 = 9
    expect(r.intervalDays).toBe(9);
  });

  it('never exceeds the 365-day ceiling', () => {
    const r = schedule(
      graduated({ rating: 'instant', intervalDays: 100, lastReviewedAt: new Date(now.getTime() - 400 * DAY) })
    );
    expect(r.intervalDays).toBe(365);
  });

  it('delay is measured from nextReviewAt: reviewed 200 d ago but due now is not late', () => {
    const r = schedule(graduated({ intervalDays: 6, lastReviewedAt: new Date(now.getTime() - 200 * DAY), nextReviewAt: now }));
    expect(r.intervalDays).toBe(15);
  });

  it('a leech stays capped no matter how late it was', () => {
    const r = schedule(graduated({ intervalDays: 6, lapses: LEECH_LAPSES, lastReviewedAt: new Date(now.getTime() - 200 * DAY) }));
    expect(r.intervalDays).toBeLessThanOrEqual(LEECH_MAX_INTERVAL_DAYS);
    expect(r.isLeech).toBe(true);
  });
});

describe('schedule — trip cap and due clamp (13)', () => {
  // now = 16 Sep 2026. 81 days left → 5 Dec; 30 → 16 Oct; 15 → 1 Oct; 12 → 28 Sep.
  const trip = (days: number) => new Date(now.getTime() + days * DAY).toISOString().slice(0, 10);

  it('caps an advance at a third of the days left (81 → 27, spread down ≤ 10%)', () => {
    const r = schedule(graduated({ intervalDays: 30, tripDate: trip(81) }));
    expect(r.intervalDays).toBeLessThanOrEqual(27);
    expect(r.intervalDays).toBeGreaterThanOrEqual(24);
    expect(r.statusIntervalDays).toBe(75);
  });

  it('30 days left caps at 10, 15 at 7', () => {
    expect(schedule(graduated({ intervalDays: 30, tripDate: trip(30), rand: () => 0 })).intervalDays).toBe(10);
    expect(schedule(graduated({ intervalDays: 30, tripDate: trip(15), rand: () => 0 })).intervalDays).toBe(7);
  });

  it('3 days left, a past trip and no trip leave the interval alone', () => {
    for (const tripDate of [trip(3), trip(-5), null]) {
      expect(schedule(graduated({ intervalDays: 30, tripDate })).intervalDays).toBe(75);
    }
  });

  it('caps at graduation too: a relearning item returns at the cap, not its old interval', () => {
    const r = schedule(fresh({ intervalDays: 40, tripDate: trip(30), rand: () => 0 }));
    expect(r.reason).toBe('graduated');
    expect(r.intervalDays).toBe(10);
    expect(r.statusIntervalDays).toBe(40);
  });

  it('a leech under a trip gets min(21, cap)', () => {
    const far = schedule(graduated({ intervalDays: 30, lapses: LEECH_LAPSES, tripDate: trip(81), rand: () => 0 }));
    expect(far.intervalDays).toBe(21);
    const near = schedule(graduated({ intervalDays: 30, lapses: LEECH_LAPSES, tripDate: trip(15), rand: () => 0 }));
    expect(near.intervalDays).toBe(7);
  });

  it('the final sweep: with 8 days left nothing comes due after day 5', () => {
    // cap is 7 but the clamp lowers it: due date must land in [1, 5].
    for (let i = 0; i < 30; i++) {
      const r = schedule(graduated({ intervalDays: 20, tripDate: trip(8), rand: Math.random }));
      expect(r.intervalDays).toBeGreaterThanOrEqual(1);
      expect(r.intervalDays).toBeLessThanOrEqual(5);
    }
  });
});

describe('schedule — integers and status (14, 15)', () => {
  it('every intervalDays is an integer across 200 randomised runs, capped values within the spread', () => {
    const ratings = ['forgot', 'hard', 'got_it', 'instant'] as const;
    const sources = ['review', 'scene', 'tutor', 'practice'] as const;
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < 200; i++) {
      const interval = rnd() * 120; // fractional on purpose
      const daysLeft = [null, 81, 30, 15, 8, 3][Math.floor(rnd() * 6)];
      const tripDate = daysLeft == null ? null : new Date(now.getTime() + daysLeft * DAY).toISOString().slice(0, 10);
      const r = schedule({
        rating: ratings[Math.floor(rnd() * 4)],
        source: sources[Math.floor(rnd() * 4)],
        easeFactor: 1.3 + rnd() * 1.4,
        intervalDays: interval,
        learningStep: [0, 1, 2][Math.floor(rnd() * 3)],
        lapses: Math.floor(rnd() * 8),
        lastReviewedAt: new Date(now.getTime() - rnd() * 200 * DAY),
        nextReviewAt: new Date(now.getTime() - (rnd() * 100 - 20) * DAY),
        now,
        tripDate,
        rand: rnd,
      });
      expect(Number.isInteger(r.intervalDays)).toBe(true);
      expect(Number.isInteger(r.statusIntervalDays)).toBe(true);
      // A graduation or advance under a trip never exceeds the cap, and a value
      // that hit it lands within the downward spread (unless the sweep clamp took over).
      const cap = tripIntervalCap(daysLeft);
      if (cap != null && (r.reason === 'graduated' || r.reason === 'review_advance')) {
        expect(r.intervalDays).toBeLessThanOrEqual(cap);
        expect(r.intervalDays).toBeGreaterThanOrEqual(1);
        if (r.statusIntervalDays > cap && daysLeft != null && daysLeft - 3 >= cap) {
          expect(r.intervalDays).toBeGreaterThan(cap - Math.max(1, Math.round(cap * 0.1)));
        }
      }
      expect(r.intervalDays).toBeGreaterThanOrEqual(0);
      expect(r.intervalDays).toBeLessThanOrEqual(365);
    }
  });

  it('status comes from the uncapped interval: Easy on 105 d under a 27 d cap is still mastered-sized', () => {
    const r = schedule(
      graduated({ rating: 'instant', intervalDays: 105, tripDate: new Date(now.getTime() + 81 * DAY).toISOString().slice(0, 10) })
    );
    expect(r.intervalDays).toBeLessThanOrEqual(27);
    expect(r.statusIntervalDays).toBeGreaterThanOrEqual(30);
  });
});

describe('schedule — legacy rows (16) and scene answers (17)', () => {
  it('a graduated row with interval 0 advances to at least a day', () => {
    const r = schedule(graduated({ intervalDays: 0, lastReviewedAt: null, nextReviewAt: now }));
    expect(r.reason).toBe('review_advance');
    expect(r.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('a step-1 row is treated as learning: hard keeps it at step 0, got_it graduates', () => {
    expect(schedule(fresh({ learningStep: 1, rating: 'hard' })).learningStep).toBe(0);
    const g = schedule(fresh({ learningStep: 1, rating: 'got_it' }));
    expect(g.learningStep).toBe(2);
    expect(g.intervalDays).toBe(1);
  });

  it('a leech stays at or under 21 days', () => {
    const r = schedule(graduated({ intervalDays: 30, lapses: LEECH_LAPSES, rating: 'instant' }));
    expect(r.intervalDays).toBeLessThanOrEqual(21);
  });

  it('a correct scene answer never lengthens and preserves nextReviewAt', () => {
    const nextReviewAt = new Date(now.getTime() - 2 * DAY);
    for (const rating of ['hard', 'got_it', 'instant'] as const) {
      const r = schedule(graduated({ source: 'scene', rating, nextReviewAt }));
      expect(r.reason).toBe('practice_no_advance');
      expect(r.intervalDays).toBe(6);
      expect(r.nextReviewAt).toEqual(nextReviewAt);
      expect(r.easeFactor).toBe(2.5);
    }
  });

  it('on-time got_it and hard on a graduated item match the formulas', () => {
    expect(schedule(graduated({ intervalDays: 10 })).intervalDays).toBe(25);
    expect(schedule(graduated({ intervalDays: 10, rating: 'hard' })).intervalDays).toBe(12);
  });
});

describe('daysAway — the x-axis of 7-day recall', () => {
  const now = new Date('2026-09-27T12:00:00Z');

  it('is null on first sight', () => {
    expect(daysAway(null, now)).toBeNull();
    expect(daysAway(undefined, now)).toBeNull();
  });

  it('counts whole days, from a Date or the string Neon returns', () => {
    expect(daysAway(new Date('2026-09-20T12:00:00Z'), now)).toBe(7);
    expect(daysAway('2026-09-20T13:00:00Z', now)).toBe(6);
    expect(daysAway('2026-08-10T07:00:00Z', now)).toBe(48);
  });

  it('never goes negative on clock skew', () => {
    expect(daysAway(new Date('2026-09-27T12:05:00Z'), now)).toBe(0);
  });
});
