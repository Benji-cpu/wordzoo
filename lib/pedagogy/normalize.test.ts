import { describe, expect, it } from 'vitest';
import {
  allowedEditsFor,
  fuzzyMatchAnswer,
  levenshtein,
  matchAnyAnswer,
  normalizeForCompare,
  normalizeSentence,
  scoreRecall,
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

describe('scoreRecall', () => {
  describe('word', () => {
    it('ignores accents, case and punctuation', () => {
      const r = scoreRecall(['obrigado'], ['Obrigado!']);
      expect(r.verdict).toBe('correct');
      expect(r.ratio).toBe(1);
      expect(r.matched).toEqual(['obrigado']);
      expect(r.missed).toEqual([]);
      expect(scoreRecall(['está'], ['esta']).verdict).toBe('correct');
    });

    it('tolerates a typo on a longer word only', () => {
      expect(scoreRecall(['obrigado'], ['obrigdo']).verdict).toBe('correct');
      expect(scoreRecall(['noite'], ['voice']).verdict).toBe('wrong');
    });

    it('is never partial: a half-said two-word answer is wrong', () => {
      const r = scoreRecall(['terima kasih'], ['terima']);
      expect(r.verdict).toBe('wrong');
      expect(r.ratio).toBe(0);
      expect(r.missed).toEqual(['terima', 'kasih']);
    });

    it('a speech alternative later in the list can win', () => {
      const r = scoreRecall(['obrigado'], ['a bridge a do', 'obrigado', 'abrigado']);
      expect(r.verdict).toBe('correct');
      expect(r.heard).toBe('obrigado');
    });

    it('checks every accepted target and reports the one matched', () => {
      const r = scoreRecall(['Sim', 'Claro'], ['claro!']);
      expect(r.verdict).toBe('correct');
      expect(r.bestTarget).toBe('Claro');
    });

    it('an empty attempt is wrong with ratio 0', () => {
      const r = scoreRecall(['obrigado'], ['  ']);
      expect(r).toMatchObject({ verdict: 'wrong', ratio: 0, heard: '', bestTarget: 'obrigado' });
      expect(scoreRecall(['obrigado'], []).verdict).toBe('wrong');
    });
  });

  describe('phrase', () => {
    const target = 'Eu gosto muito de café';

    it('full recall is correct', () => {
      const r = scoreRecall([target], ['eu gosto muito de cafe']);
      expect(r).toMatchObject({ verdict: 'correct', ratio: 1, missed: [] });
    });

    it('most of it is partial and lists the missed words in target order', () => {
      const r = scoreRecall([target], ['eu gosto de café']);
      expect(r.verdict).toBe('partial');
      expect(r.ratio).toBeCloseTo(0.8);
      expect(r.matched).toEqual(['Eu', 'gosto', 'de', 'café']);
      expect(r.missed).toEqual(['muito']);
    });

    it('under 60% is wrong', () => {
      const r = scoreRecall([target], ['eu gosto']);
      expect(r.verdict).toBe('wrong');
      expect(r.ratio).toBeCloseTo(0.4);
      expect(r.missed).toEqual(['muito', 'de', 'café']);
    });

    it('matched and missed keep the target casing and accents', () => {
      const r = scoreRecall(['Está uma delícia!'], ['esta delicia']);
      expect(r.matched).toEqual(['Está', 'delícia']);
      expect(r.missed).toEqual(['uma']);
    });

    it('words in the wrong order do not all count', () => {
      const r = scoreRecall(['um dois tres quatro'], ['quatro tres dois um']);
      expect(r.verdict).toBe('wrong');
    });

    it('a typo inside a word still lines up', () => {
      const r = scoreRecall(['Tudo bem, obrigado!'], ['tudo bem obrigdo']);
      expect(r.verdict).toBe('correct');
    });

    it('lots of extra words downgrade correct to partial', () => {
      const r = scoreRecall(['Tudo bem obrigado'], ['bom dia então tudo bem obrigado sim']);
      expect(r.ratio).toBe(1);
      expect(r.verdict).toBe('partial');
    });

    it('a couple of extra words are fine', () => {
      expect(scoreRecall(['Tudo bem obrigado'], ['ah tudo bem obrigado']).verdict).toBe('correct');
    });

    it('picks the best of several alternatives and several targets', () => {
      const r = scoreRecall(
        ['Está muito bom', 'Que delícia'],
        ['esta muito', 'que delicia'],
        { kind: 'phrase' },
      );
      expect(r.verdict).toBe('correct');
      expect(r.bestTarget).toBe('Que delícia');
    });

    it('an empty attempt is wrong with ratio 0', () => {
      const r = scoreRecall([target], ['']);
      expect(r).toMatchObject({ verdict: 'wrong', ratio: 0 });
      expect(r.missed).toEqual(['Eu', 'gosto', 'muito', 'de', 'café']);
    });
  });
});
