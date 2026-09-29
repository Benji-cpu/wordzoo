import { describe, expect, it } from 'vitest';
import {
  allowedEditsFor,
  fuzzyMatchAnswer,
  levenshtein,
  matchAnyAnswer,
  normalizeForCompare,
  normalizeSentence,
} from './normalize';

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

describe('normalizeSentence', () => {
  it('drops punctuation and collapses spacing on top of accents and case', () => {
    expect(normalizeSentence('Tudo bem, obrigado!')).toBe('tudo bem obrigado');
    expect(normalizeSentence('  Está   uma delícia. ')).toBe('esta uma delicia');
    expect(normalizeSentence('Bem-vindo!')).toBe('bem vindo');
  });
});

describe('matchAnyAnswer', () => {
  const answers = ['Está uma delícia!', 'Está muito bom!', 'Que delícia!'];

  it('matches any accepted answer, ignoring punctuation and accents', () => {
    expect(matchAnyAnswer('esta uma delicia', answers)).toBe('Está uma delícia!');
    expect(matchAnyAnswer('Que delicia', answers)).toBe('Que delícia!');
    expect(matchAnyAnswer('está muito bom.', answers)).toBe('Está muito bom!');
  });

  it('tolerates a typo in a sentence', () => {
    expect(matchAnyAnswer('esta uma delisia', answers)).toBe('Está uma delícia!');
  });

  it('rejects a different sentence and an empty attempt', () => {
    expect(matchAnyAnswer('Eu estou cansado', answers)).toBeNull();
    expect(matchAnyAnswer('  !! ', answers)).toBeNull();
  });

  it('forgives a typo inside a word but not a different word', () => {
    expect(matchAnyAnswer('Vamos cantar?', ['Vamos nadar?'])).toBeNull();
    expect(matchAnyAnswer('Vamos nadra?', ['Vamos nadar?'])).toBeNull(); // 5 chars: 1 edit, this is 2
    expect(matchAnyAnswer('Vamos nadr', ['Vamos nadar?'])).toBe('Vamos nadar?');
    expect(matchAnyAnswer('Tudo bem obrigdo', ['Tudo bem, obrigado!'])).toBe('Tudo bem, obrigado!');
  });

  it('treats a missing or extra word as a different answer, but not spacing', () => {
    expect(matchAnyAnswer('Está delícia', ['Está uma delícia!'])).toBeNull();
    expect(matchAnyAnswer('Está muito uma delícia', ['Está uma delícia!'])).toBeNull();
    expect(matchAnyAnswer('bemvindo', ['Bem-vindo!'])).toBe('Bem-vindo!');
  });

  it('keeps short answers exact', () => {
    expect(matchAnyAnswer('nao', ['Sim'])).toBeNull();
    expect(matchAnyAnswer('sim!', ['Sim'])).toBe('Sim');
  });
});
