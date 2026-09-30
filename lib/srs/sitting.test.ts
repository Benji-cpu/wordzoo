import { describe, expect, it } from 'vitest';
import { catchUpSlots, composeSitting, CATCH_UP_FROM_DUE } from './sitting';

interface Item {
  id: string;
  interval: number;
}
const weak = (n: number): Item[] => Array.from({ length: n }, (_, i) => ({ id: `w${i}`, interval: i % 3 }));
const mature = (n: number): Item[] => Array.from({ length: n }, (_, i) => ({ id: `m${i}`, interval: 10 + i }));
const compose = (over: Partial<Parameters<typeof composeSitting<Item>>[0]>) =>
  composeSitting<Item>({
    weakFirst: [],
    matureOverdue: [],
    slots: 14,
    totalDue: 100,
    key: (i) => i.id,
    intervalDays: (i) => i.interval,
    ...over,
  });

describe('catchUpSlots', () => {
  it('is zero at or below 40 due, about 30% above', () => {
    expect(catchUpSlots(14, CATCH_UP_FROM_DUE)).toBe(0);
    expect(catchUpSlots(14, CATCH_UP_FROM_DUE + 1)).toBe(4);
    expect(catchUpSlots(6, 100)).toBe(2);
    expect(catchUpSlots(0, 100)).toBe(0);
  });
});

describe('composeSitting', () => {
  it('is just the weak-first list when 40 or fewer are due', () => {
    const out = compose({ weakFirst: weak(30), matureOverdue: mature(10), totalDue: 40 });
    expect(out.map((i) => i.id)).toEqual(weak(14).map((i) => i.id));
  });

  it('gives ~30% of the slots to the most overdue mature items when more than 40 are due', () => {
    const out = compose({ weakFirst: weak(30), matureOverdue: mature(10) });
    expect(out).toHaveLength(14);
    expect(out.filter((i) => i.id.startsWith('m')).map((i) => i.id)).toEqual(['m0', 'm1', 'm2', 'm3']);
    expect(out.filter((i) => i.id.startsWith('w')).map((i) => i.id)).toEqual(weak(10).map((i) => i.id));
  });

  it('spreads the mature items through the sitting rather than tacking them on the end', () => {
    const out = compose({ weakFirst: weak(30), matureOverdue: mature(10) });
    const at = out.map((i, idx) => (i.id.startsWith('m') ? idx : -1)).filter((x) => x >= 0);
    expect(at[0]).toBeLessThan(6);
    expect(at[at.length - 1]).toBeGreaterThan(8);
    expect(out[out.length - 1].id.startsWith('m')).toBe(false);
  });

  it('never repeats an item that is in both lists', () => {
    const shared = [{ id: 'w0', interval: 20 }, ...mature(3)];
    const out = compose({ weakFirst: [...shared, ...weak(30).slice(1)], matureOverdue: shared });
    const ids = out.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(14);
  });

  it('a short mature list leaves the room to weak items; immature "mature" rows are ignored', () => {
    const out = compose({ weakFirst: weak(30), matureOverdue: [{ id: 'm0', interval: 12 }, { id: 'x', interval: 3 }] });
    expect(out).toHaveLength(14);
    expect(out.filter((i) => i.id === 'm0')).toHaveLength(1);
    expect(out.some((i) => i.id === 'x')).toBe(false);
  });

  it('returns fewer than the slots when little is due, and nothing for zero slots', () => {
    expect(compose({ weakFirst: weak(3), totalDue: 3 })).toHaveLength(3);
    expect(compose({ weakFirst: weak(3), slots: 0 })).toEqual([]);
  });
});
