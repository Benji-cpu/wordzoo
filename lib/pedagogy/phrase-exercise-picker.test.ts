import { describe, expect, it } from 'vitest';
import { pickClozeWord } from './phrase-exercise-picker';
import type { PhraseWordMnemonic } from '@/types/database';

function w(word_text: string): PhraseWordMnemonic {
  return {
    word_id: `id-${word_text}`,
    word_text,
    word_en: '',
    part_of_speech: '',
    position: 0,
    keyword_text: null,
    bridge_sentence: null,
    image_url: null,
  };
}

describe('pickClozeWord', () => {
  it('skips words that are not in the sentence', () => {
    const phrase = { text_target: 'Eu falo português', words: [w('falar'), w('português')] };
    expect(pickClozeWord(phrase)?.word_text).toBe('português');
  });

  it('skips words that only occur inside another word', () => {
    const phrase = { text_target: 'Qual é o seu nome', words: [w('seu'), w('nome'), w('quale')] };
    // 'quale' is absent; both others qualify, longest wins.
    expect(pickClozeWord(phrase)?.word_text).toBe('nome');
  });

  it('prefers a single token over a longer multi-word entry', () => {
    const phrase = {
      text_target: 'Muito prazer, boa noite',
      words: [w('boa noite'), w('prazer')],
    };
    expect(pickClozeWord(phrase)?.word_text).toBe('prazer');
  });

  it('keeps the minimum length rule', () => {
    const phrase = { text_target: 'Eu vou ao mar', words: [w('vou'), w('mar')] };
    expect(pickClozeWord(phrase)).toBeNull();
  });

  it('returns null when nothing qualifies', () => {
    expect(pickClozeWord({ text_target: 'Bom dia', words: [w('noite')] })).toBeNull();
    expect(pickClozeWord({ text_target: 'Bom dia', words: [] })).toBeNull();
  });
});
