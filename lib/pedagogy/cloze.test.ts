import { describe, expect, it } from 'vitest';
import { blankSentence, findClozeSpan, usableClozePhrases } from './cloze';

describe('findClozeSpan', () => {
  it('finds a whole word case-insensitively', () => {
    const s = 'Como te chamas?';
    expect(findClozeSpan(s, 'CHAMAS')).toEqual({ start: 8, end: 14 });
  });

  it('treats accents as significant', () => {
    expect(findClozeSpan('Eu gosto de café', 'café')).not.toBeNull();
    expect(findClozeSpan('Eu gosto de café', 'cafe')).toBeNull();
    expect(findClozeSpan('Eu gosto de cafe', 'café')).toBeNull();
  });

  it('matches across NFC/NFD forms of the same letter', () => {
    expect(findClozeSpan('Eu gosto de café', 'café')).not.toBeNull();
  });

  it('handles punctuation adjacent to the word', () => {
    const s = 'Qual é o teu nome?';
    const span = findClozeSpan(s, 'nome');
    expect(span).not.toBeNull();
    expect(s.slice(span!.start, span!.end)).toBe('nome');
  });

  it('does not match inside another word', () => {
    expect(findClozeSpan('Qual é o seu nome', 'eu')).toBeNull();
    expect(findClozeSpan('Eu sou seu amigo', 'eu')).toEqual({ start: 0, end: 2 });
  });

  it('matches multi-word targets only as contiguous whole words', () => {
    const s = 'Muito obrigado, boa noite!';
    expect(findClozeSpan(s, 'boa noite')).toEqual({ start: 16, end: 25 });
    expect(findClozeSpan(s, 'obrigado boa')).toBeNull();
    expect(findClozeSpan('boa e noite', 'boa noite')).toBeNull();
  });

  it('splits on apostrophes and hyphens', () => {
    expect(findClozeSpan("Je bois l'eau", 'eau')).toEqual({ start: 10, end: 13 });
    expect(findClozeSpan('Diga-me o nome', 'diga')).toEqual({ start: 0, end: 4 });
  });

  it('returns null when the target is absent or empty', () => {
    expect(findClozeSpan('Bom dia', 'noite')).toBeNull();
    expect(findClozeSpan('Bom dia', '')).toBeNull();
    expect(findClozeSpan('', 'dia')).toBeNull();
  });
});

describe('blankSentence', () => {
  it('returns the surface form as written, not the target', () => {
    expect(blankSentence('Eu Falo português', 'falo')).toEqual({
      before: 'Eu ',
      after: ' português',
      answer: 'Falo',
    });
  });

  it('keeps punctuation in before/after', () => {
    expect(blankSentence('Qual é o teu nome?', 'nome')).toEqual({
      before: 'Qual é o teu ',
      after: '?',
      answer: 'nome',
    });
  });

  it('is null when the word is not literally present', () => {
    expect(blankSentence('Eu falo português', 'falar')).toBeNull();
  });
});

describe('usableClozePhrases', () => {
  it('keeps only phrases where the word can be blanked', () => {
    const phrases = [
      { text_target: 'Eu sou seu amigo', word_text: 'eu' },
      { text_target: 'Bom dia', word_text: 'noite' },
    ];
    expect(usableClozePhrases(phrases, 'eu')).toHaveLength(1);
    expect(usableClozePhrases(phrases, 'nada')).toHaveLength(1);
  });
});
