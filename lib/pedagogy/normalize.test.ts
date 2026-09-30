import { describe, expect, it } from 'vitest';
import {
  allowedEditsFor,
  fuzzyMatchAnswer,
  levenshtein,
  matchAnyAnswer,
  normalizeForCompare,
  normalizeNumbers,
  normalizeSentence,
  numberToPortuguese,
  scoreRecall,
  similarity,
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

describe('numbers', () => {
  it('spells 0-100 in Portuguese and leaves the rest alone', () => {
    expect(numberToPortuguese(0)).toBe('zero');
    expect(numberToPortuguese(13)).toBe('treze');
    expect(numberToPortuguese(20)).toBe('vinte');
    expect(numberToPortuguese(45)).toBe('quarenta e cinco');
    expect(numberToPortuguese(100)).toBe('cem');
    expect(numberToPortuguese(101)).toBeNull();
    expect(numberToPortuguese(-1)).toBeNull();
  });

  it('turns digits, "R$ N" and "N reais" into words', () => {
    expect(normalizeNumbers('5')).toBe('cinco');
    expect(normalizeNumbers('R$ 5')).toBe('cinco reais');
    expect(normalizeNumbers('R$5')).toBe('cinco reais');
    expect(normalizeNumbers('R$ 1')).toBe('um real');
    expect(normalizeNumbers('5 reais')).toBe('cinco reais');
    expect(normalizeNumbers('são 12 horas')).toBe('são doze horas');
    expect(normalizeNumbers('sala 2b')).toBe('sala 2b');
    expect(normalizeNumbers('1500')).toBe('1500');
  });

  it('scores a spoken digit against a target written in words', () => {
    expect(scoreRecall(['cinco reais'], ['R$ 5']).verdict).toBe('correct');
    expect(scoreRecall(['cinco reais'], ['5 reais']).verdict).toBe('correct');
    expect(scoreRecall(['dez'], ['10']).verdict).toBe('correct');
    expect(scoreRecall(['vinte e um'], ['21']).verdict).toBe('correct');
    expect(scoreRecall(['dez'], ['11']).verdict).toBe('wrong');
  });
});

describe('similarity', () => {
  it('is 1 for the same sentence and falls with distance', () => {
    expect(similarity('Tudo bem!', 'tudo bem')).toBe(1);
    expect(similarity('obrigado', 'obrigada')).toBeGreaterThan(0.8);
    expect(similarity('abc', 'xyz')).toBe(0);
    expect(similarity('', '')).toBe(0);
  });
});

describe('scoreRecall - spoken short words', () => {
  it('a recogniser alternative one edit away counts for a 3-letter word', () => {
    expect(scoreRecall(['sim'], ['sem'], { spoken: true }).verdict).toBe('correct');
    expect(scoreRecall(['sim'], ['sem'], {}).verdict).toBe('wrong');
    expect(scoreRecall(['sim'], ['não', 'sem'], { spoken: true }).verdict).toBe('correct');
  });

  it('but two edits, or a longer word, do not get the extra edit', () => {
    expect(scoreRecall(['sim'], ['sol'], { spoken: true }).verdict).toBe('wrong');
    expect(scoreRecall(['casa'], ['caso'], { spoken: true, noVariants: ['caso'] }).verdict).toBe('wrong');
    expect(scoreRecall(['noite'], ['voice'], { spoken: true }).verdict).toBe('wrong');
  });

  it('applies inside a phrase too', () => {
    const r = scoreRecall(['Eu vou sim'], ['eu vou sem'], { kind: 'phrase', spoken: true });
    expect(r.verdict).toBe('correct');
  });
});

describe('scoreRecall - hyphens', () => {
  it('treats hyphens as spaces', () => {
    expect(scoreRecall(['guarda-chuva'], ['guarda chuva']).verdict).toBe('correct');
    expect(scoreRecall(['guarda chuva'], ['guarda-chuva']).verdict).toBe('correct');
    expect(scoreRecall(['guarda-chuva'], ['guardachuva']).verdict).toBe('correct');
  });
});

describe('scoreRecall - gender endings', () => {
  it('accepts the other o/a ending of a single word and says so', () => {
    const r = scoreRecall(['gato'], ['gata']);
    expect(r.verdict).toBe('correct');
    expect(r.variant).toBe('gender');
    expect(r.bestTarget).toBe('gata');
    expect(scoreRecall(['gata'], ['gato']).variant).toBe('gender');
  });

  it('a plain right answer carries no variant', () => {
    const r = scoreRecall(['obrigado'], ['obrigado']);
    expect(r.variant).toBeUndefined();
    expect(r.bestTarget).toBe('obrigado');
  });

  it('prefers the typed form when both endings are near', () => {
    const r = scoreRecall(['obrigado'], ['obrigada']);
    expect(r.verdict).toBe('correct');
    expect(r.bestTarget).toBe('obrigada');
    expect(r.variant).toBe('gender');
  });

  it('does not apply to phrases or to a flip listed in noVariants', () => {
    expect(scoreRecall(['Eu vejo o gato'], ['eu vejo o gata']).verdict).not.toBe('correct');
    expect(scoreRecall(['casa'], ['caso'], { noVariants: ['caso'] }).verdict).toBe('wrong');
    expect(scoreRecall(['casa'], ['caso']).verdict).toBe('correct');
  });

  it('a different word that only shares a stem is still wrong', () => {
    expect(scoreRecall(['bonito'], ['bonitos']).verdict).toBe('correct'); // 1 edit on a 6-letter word
    expect(scoreRecall(['gato'], ['pato']).verdict).toBe('wrong');
  });
});

describe('scoreRecall - content words', () => {
  const opts = { kind: 'phrase' as const, contentWords: true };

  it('function words are shown but not required', () => {
    const r = scoreRecall(['Eu gosto muito de café'], ['eu gosto muito café'], opts);
    expect(r.verdict).toBe('correct');
    expect(r.total).toBe(4);
    expect(r.missed).toEqual([]);
  });

  it('all content words is correct even with every function word dropped', () => {
    const r = scoreRecall(['Quero um copo de água com gelo'], ['quero copo água gelo'], opts);
    expect(r.verdict).toBe('correct');
  });

  it('half the content words (of three or more) is partial and names the misses', () => {
    const r = scoreRecall(['Eu gosto muito de café'], ['eu gosto'], opts);
    expect(r.verdict).toBe('partial');
    expect(r.ratio).toBeCloseTo(0.5);
    expect(r.missed).toEqual(['muito', 'café']);
    expect(r.matched).toEqual(['Eu', 'gosto']);
  });

  it('under half is wrong', () => {
    const r = scoreRecall(['Eu gosto muito de café'], ['gosto'], opts);
    expect(r.verdict).toBe('wrong');
  });

  it('a phrase with fewer than three content words is all-or-nothing', () => {
    const r = scoreRecall(['Bom dia, como vai?'], ['bom dia'], opts);
    // content: bom, dia, como, vai = 4 -> partial
    expect(r.verdict).toBe('partial');
    const short = scoreRecall(['Que horas são?'], ['horas'], opts);
    // content: horas, são = 2 -> wrong, not partial
    expect(short.verdict).toBe('wrong');
  });

  it('names mid-sentence are not required; sentence-initial capitals are', () => {
    const r = scoreRecall(['Meu nome é Ana e moro em Curitiba'], ['meu nome moro'], opts);
    // Ana and Curitiba are names; content = meu, nome, moro
    expect(r.verdict).toBe('correct');
    const initial = scoreRecall(['Casa grande e bonita'], ['grande bonita'], opts);
    // Casa is sentence-initial so it counts: 2 of 3 content words
    expect(initial.verdict).toBe('partial');
  });

  it('a capital after a full stop is sentence-initial, after a comma it is a name', () => {
    const after = scoreRecall(['Tudo bem. Vamos comer agora'], ['tudo bem comer agora'], opts);
    expect(after.missed).toEqual(['Vamos']);
    expect(after.verdict).toBe('partial'); // "Vamos" missing but required
    const comma = scoreRecall(['Tudo bem, Ana, vamos comer'], ['tudo bem vamos comer'], opts);
    expect(comma.verdict).toBe('correct');
  });

  it('names passed in are not required either', () => {
    // "Benji" opens the sentence, so only being passed in exempts it
    const r = scoreRecall(['Benji mora aqui'], ['mora aqui'], { ...opts, names: ['Benji'] });
    expect(r.verdict).toBe('correct');
    const without = scoreRecall(['Benji mora aqui'], ['mora aqui'], opts);
    expect(without.verdict).toBe('partial');
  });

  it('the same phrase without the option keeps the old thresholds', () => {
    const r = scoreRecall(['Eu gosto muito de café'], ['eu gosto']);
    expect(r.verdict).toBe('wrong');
  });

  it('an all-function phrase falls back to scoring every word', () => {
    const r = scoreRecall(['É o que?'], ['é o que'], opts);
    expect(r.verdict).toBe('correct');
    expect(scoreRecall(['É o que?'], ['é'], opts).verdict).toBe('wrong');
  });

  it('a spoken 3-letter content word gets its one edit', () => {
    const r = scoreRecall(['Eu vou sim agora'], ['eu vou sem agora'], { ...opts, spoken: true });
    expect(r.verdict).toBe('correct');
  });

  it('a wrong-order attempt does not count words out of order', () => {
    const r = scoreRecall(['gosto muito café'], ['café muito gosto'], opts);
    expect(r.verdict).not.toBe('correct');
  });
});
