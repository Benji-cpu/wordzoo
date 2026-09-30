import { describe, expect, it } from 'vitest';
import { tripDaysLeft, tripIntervalCap, tripDueClamp, spread, applyTripSchedule, tripBulkCap } from './trip';

const now = new Date('2026-09-30T13:00:00Z');

describe('tripDaysLeft', () => {
  it('counts whole UTC days to a YYYY-MM-DD date', () => {
    expect(tripDaysLeft('2026-12-20', now)).toBe(81);
    expect(tripDaysLeft('2026-09-30', now)).toBe(0);
    expect(tripDaysLeft('2026-09-25', now)).toBe(-5);
  });

  it('is null for no or an invalid trip', () => {
    expect(tripDaysLeft(null, now)).toBeNull();
    expect(tripDaysLeft(undefined, now)).toBeNull();
    expect(tripDaysLeft('soon', now)).toBeNull();
  });

  it('uses the UTC date of a Date, and the time of day of now does not matter', () => {
    expect(tripDaysLeft(new Date('2026-12-20T00:00:00Z'), now)).toBe(81);
    expect(tripDaysLeft('2026-12-20', new Date('2026-09-30T23:59:59Z'))).toBe(81);
    expect(tripDaysLeft('2026-12-20', new Date('2026-09-30T00:00:00Z'))).toBe(81);
  });
});

describe('tripIntervalCap', () => {
  it('a third of the days left, between a week and a month', () => {
    expect(tripIntervalCap(81)).toBe(27);
    expect(tripIntervalCap(30)).toBe(10);
    expect(tripIntervalCap(15)).toBe(7);
    expect(tripIntervalCap(4)).toBe(7);
    expect(tripIntervalCap(200)).toBe(30);
  });

  it('none when there is no trip, it has passed, or 3 days or fewer remain', () => {
    expect(tripIntervalCap(null)).toBeNull();
    expect(tripIntervalCap(undefined)).toBeNull();
    expect(tripIntervalCap(3)).toBeNull();
    expect(tripIntervalCap(0)).toBeNull();
    expect(tripIntervalCap(-10)).toBeNull();
  });
});

describe('spread', () => {
  it('goes downward only, by at most ~10% (at least 1 step), never below 1', () => {
    expect(spread(27, () => 0)).toBe(27);
    expect(spread(27, () => 0.999)).toBe(25); // width round(2.7) = 3 → 0..2
    expect(spread(7, () => 0.999)).toBe(7); // width 1 → no shift
    expect(spread(1, () => 0.999)).toBe(1);
    for (let i = 0; i < 100; i++) {
      const v = spread(30, Math.random);
      expect(v).toBeGreaterThanOrEqual(27);
      expect(v).toBeLessThanOrEqual(30);
    }
  });
});

describe('tripDueClamp', () => {
  it('spreads an interval that would land after trip − 3 over [max(1, days − 10), days − 3]', () => {
    // 12 days left, interval 10: due on day 10 > day 9.
    for (let i = 0; i < 100; i++) {
      const v = tripDueClamp(10, 12, Math.random);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(9);
      expect(Number.isInteger(v)).toBe(true);
    }
    expect(tripDueClamp(10, 12, () => 0)).toBe(2);
    expect(tripDueClamp(10, 12, () => 0.999)).toBe(9);
  });

  it('leaves an interval that already fits, and does nothing close to the trip', () => {
    expect(tripDueClamp(9, 12, () => 0.5)).toBe(9);
    expect(tripDueClamp(10, 4, () => 0.5)).toBe(10);
    expect(tripDueClamp(10, 3, () => 0.5)).toBe(10);
    expect(tripDueClamp(10, null, () => 0.5)).toBe(10);
  });

  it('the window floor is 1 day', () => {
    expect(tripDueClamp(30, 6, () => 0)).toBe(1);
  });
});

describe('applyTripSchedule and tripBulkCap', () => {
  it('caps, then clamps', () => {
    expect(applyTripSchedule(75, 81, () => 0)).toBe(27);
    expect(applyTripSchedule(5, 81, () => 0)).toBe(5);
    expect(applyTripSchedule(75, null, () => 0)).toBe(75);
    // 8 days left: cap 7 lands after day 5, so the clamp takes over.
    expect(applyTripSchedule(40, 8, () => 0)).toBe(1);
  });

  it('the bulk cap is the cap, lowered to the sweep buffer near the trip', () => {
    expect(tripBulkCap(81)).toBe(27);
    expect(tripBulkCap(8)).toBe(5);
    expect(tripBulkCap(4)).toBe(7);
    expect(tripBulkCap(3)).toBeNull();
    expect(tripBulkCap(null)).toBeNull();
  });
});
