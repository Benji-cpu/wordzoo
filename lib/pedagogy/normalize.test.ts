import { describe, expect, it } from 'vitest';
import { allowedEditsFor, fuzzyMatchAnswer, levenshtein, normalizeForCompare } from './normalize';

describe('normalizeForCompare', () => {
  it('ignores case, surrounding space and accents', () => {
    expect(normalizeForCompare('  Terima Kasih ')).toBe('terima kasih');
    expect(normalizeForCompare('café')).toBe('cafe');
    expect(normalizeForCompare('Ñandú')).toBe('nandu');
  });
});

describe('levenshtein', () => {
  it('counts single edits', () => {
    expect(levenshtein('kabar', 'kabar')).toBe(0);
    expect(levenshtein('kabar', 'kebab')).toBe(2);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});

describe('allowedEditsFor — tolerance scales with length', () => {
  it('short words are exact-only', () => {
    expect(allowedEditsFor('dua')).toBe(0);
    expect(allowedEditsFor('noite')).toBe(1);
    expect(allowedEditsFor('quarto')).toBe(1);
    expect(allowedEditsFor('selamat pagi')).toBe(3);
    expect(allowedEditsFor('a sentence long enough to hit the cap')).toBe(5);
  });
});

describe('fuzzyMatchAnswer', () => {
  it('"voice" is not "noite" — the short-word free pass stays closed', () => {
    expect(fuzzyMatchAnswer('voice', 'noite').kind).toBe('wrong');
    expect(fuzzyMatchAnswer('quatro', 'quarto').kind).toBe('wrong');
  });

  it('a one-letter slip on a longer word is close, and names the canonical answer', () => {
    const r = fuzzyMatchAnswer('terima kasi', 'terima kasih');
    expect(r.kind).toBe('close');
    if (r.kind === 'close') expect(r.canonicalAnswer).toBe('terima kasih');
  });

  it('accents never cost an edit', () => {
    expect(fuzzyMatchAnswer('cafe', 'café').kind).toBe('exact');
  });

  it('transcription checks can demand exactness', () => {
    expect(fuzzyMatchAnswer('terima kasi', 'terima kasih', 0).kind).toBe('wrong');
  });
});
