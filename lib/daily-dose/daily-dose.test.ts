import { describe, expect, it } from 'vitest';
import { getDailyDose } from './index';
import { PT_DAILY_DOSE } from './pt';
import { splitSentences } from './sentences';

const LEVELS = ['easy', 'medium', 'hard'] as const;

function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);
}

describe('PT_DAILY_DOSE content', () => {
  it('has one card a day from 29 Sep to 20 Dec 2026, in order', () => {
    expect(PT_DAILY_DOSE).toHaveLength(83);
    PT_DAILY_DOSE.forEach((entry, i) => {
      expect(entry.date).toBe(addDays('2026-09-29', i));
    });
  });

  it('fills every field', () => {
    for (const entry of PT_DAILY_DOSE) {
      for (const value of Object.values(entry)) {
        expect(typeof value === 'string' && value.trim().length > 0, `${entry.date}`).toBe(true);
      }
    }
  });

  // InfoByteCard shows each Portuguese sentence with its English under it; a
  // mismatch silently drops the card to two unaligned blocks.
  it('splits Portuguese and English into the same number of sentences at every level', () => {
    for (const entry of PT_DAILY_DOSE) {
      for (const level of LEVELS) {
        const pt = splitSentences(entry[`${level}_target`]).length;
        const en = splitSentences(entry[`${level}_english`]).length;
        expect(pt, `${entry.date} ${level}`).toBe(en);
      }
    }
  });

  it('grows from easy to hard', () => {
    const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
    for (const entry of PT_DAILY_DOSE) {
      expect(words(entry.easy_target), entry.date).toBeLessThan(words(entry.medium_target));
      expect(words(entry.medium_target), entry.date).toBeLessThan(words(entry.hard_target));
    }
  });
});

describe('getDailyDose', () => {
  it("returns the card written for today's UTC date", () => {
    expect(getDailyDose('pt', new Date('2026-10-12T15:00:00Z'))?.date).toBe('2026-10-12');
    expect(getDailyDose('pt', new Date('2026-12-20T23:59:59Z'))?.date).toBe('2026-12-20');
  });

  it('shows the first card before the range', () => {
    expect(getDailyDose('pt', new Date('2026-09-01T00:00:00Z'))?.date).toBe('2026-09-29');
  });

  it('keeps changing after the range instead of going blank', () => {
    const a = getDailyDose('pt', new Date('2026-12-21T10:00:00Z'));
    const b = getDailyDose('pt', new Date('2026-12-22T10:00:00Z'));
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a?.date).not.toBe(b?.date);
    // Deterministic: the same day always gives the same card.
    expect(getDailyDose('pt', new Date('2026-12-21T01:00:00Z'))?.date).toBe(a?.date);
  });

  it('returns null for a language with no written cards', () => {
    expect(getDailyDose('id', new Date('2026-10-12T00:00:00Z'))).toBeNull();
    expect(getDailyDose(null)).toBeNull();
    expect(getDailyDose(undefined)).toBeNull();
  });
});
