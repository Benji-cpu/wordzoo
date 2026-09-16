import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { BEAT, MOTION, REVEAL_STEPS, PACE_FLOOR, ladder, paceFor } from './pace';

describe('the reveal ladder', () => {
  // The onboarding demo is the one sequence a stranger is judged on, and it is
  // the reason this system exists. Extracting it must not have moved it.
  it('still schedules the demo exactly as it did before extraction', () => {
    const before = [1000, 2000, 2500, 3500, 4000, 4500];
    expect([...REVEAL_STEPS]).toEqual(before);

    for (const multiplier of [1.0, 0.8, 0.6]) {
      expect(REVEAL_STEPS.map((ms) => Math.round(ms * multiplier))).toEqual(
        before.map((ms) => Math.round(ms * multiplier)),
      );
    }
  });
});

describe('ladder', () => {
  it('reproduces the demo ladder from its gaps', () => {
    expect(ladder(1000, 1000, 500, 1000, 500, 500)).toEqual([...REVEAL_STEPS]);
  });

  it('is monotonic and starts at the first gap, not at zero', () => {
    const l = ladder(600, 600, 400);
    expect(l).toEqual([600, 1200, 1600]);
  });

  it('returns nothing for no beats', () => {
    expect(ladder()).toEqual([]);
  });
});

describe('paceFor', () => {
  it('follows the approved curve, then holds at the floor', () => {
    expect([0, 1, 2, 3, 4, 5, 20].map(paceFor)).toEqual([1, 0.85, 0.7, 0.6, PACE_FLOOR, PACE_FLOOR, PACE_FLOOR]);
  });

  it('never speeds up again, and never returns zero', () => {
    const values = Array.from({ length: 30 }, (_, i) => paceFor(i));
    values.forEach((v, i) => {
      if (i > 0) expect(v).toBeLessThanOrEqual(values[i - 1]);
      expect(v).toBeGreaterThan(0);
    });
  });

  it('treats a negative index as the first repetition rather than going faster', () => {
    expect(paceFor(-3)).toBe(1);
  });
});

describe('BEAT', () => {
  // These are the values that were copy-pasted across the learn components. If one
  // changes here it must change in app/globals.css too — see the note in pace.ts.
  it('preserves the durations the components were already using', () => {
    expect(BEAT).toEqual({
      tapAdvance: 220,
      shake: 400,
      linePause: 400,
      dwellCorrect: 1100,
      dwellReveal: 1300,
      toast: 2000,
    });
  });
});

describe('MOTION', () => {
  // The CSS tokens came first and nothing in JavaScript read them, so the two
  // could disagree silently. They cannot any more.
  it('matches the --duration-* tokens in globals.css', () => {
    const css = readFileSync('app/globals.css', 'utf8');
    const read = (name: string) => {
      const found = new RegExp(`--duration-${name}:\\s*(\\d+)ms`).exec(css);
      if (!found) throw new Error(`--duration-${name} is not defined in globals.css`);
      return Number(found[1]);
    };
    expect({
      micro: read('micro'),
      transition: read('transition'),
      reveal: read('reveal'),
      spring: read('spring'),
      celebrate: read('celebrate'),
      big: read('big'),
    }).toEqual(MOTION);
  });
});
