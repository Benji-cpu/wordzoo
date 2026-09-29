import { describe, it, expect } from 'vitest';
import {
  GIVE_UP_COOLDOWN_HOURS,
  cooldownForFails,
  decideCertifyAction,
  normalizeLoose,
  parseCertifyRequest,
  restingFeedback,
} from './can-do-certify';

const NOW = Date.parse('2026-09-30T12:00:00Z');
const past = '2026-09-29T12:00:00Z';
const future = '2026-10-01T12:00:00Z';

describe('decideCertifyAction', () => {
  it('returns the settled pass for an already certified row, even with a past eligible_at', () => {
    expect(decideCertifyAction({ status: 'certified', eligibleAt: past }, { gaveUp: false }, NOW)).toEqual({
      action: 'return_settled',
      status: 'certified',
    });
  });

  it('a duplicate give-up on a certified row is still just the settled pass', () => {
    expect(decideCertifyAction({ status: 'certified', eligibleAt: past }, { gaveUp: true }, NOW).action).toBe(
      'return_settled',
    );
  });

  it('returns resting with nextEligibleAt when eligible_at is in the future', () => {
    expect(decideCertifyAction({ status: 'unlocked', eligibleAt: future }, { gaveUp: false }, NOW)).toEqual({
      action: 'return_settled',
      status: 'resting',
      nextEligibleAt: '2026-10-01T12:00:00.000Z',
    });
  });

  it('understands the Postgres text timestamp format', () => {
    const d = decideCertifyAction({ status: 'unlocked', eligibleAt: '2026-10-01 12:00:00+00' }, { gaveUp: false }, NOW);
    expect(d).toMatchObject({ action: 'return_settled', status: 'resting' });
  });

  it('a give-up while resting does not reset the clock', () => {
    expect(decideCertifyAction({ status: 'unlocked', eligibleAt: future }, { gaveUp: true }, NOW).action).toBe(
      'return_settled',
    );
  });

  it('give-up on an eligible row is a 12 hour rest', () => {
    expect(decideCertifyAction({ status: 'unlocked', eligibleAt: past }, { gaveUp: true }, NOW)).toEqual({
      action: 'give_up',
      cooldownHours: 12,
    });
    expect(GIVE_UP_COOLDOWN_HOURS).toBe(12);
  });

  it('an eligible row with an attempt is graded', () => {
    expect(decideCertifyAction({ status: 'unlocked', eligibleAt: past }, { gaveUp: false }, NOW)).toEqual({
      action: 'grade',
    });
  });

  it('eligible exactly now is gradable, not resting', () => {
    const at = new Date(NOW).toISOString();
    expect(decideCertifyAction({ status: 'unlocked', eligibleAt: at }, { gaveUp: false }, NOW).action).toBe('grade');
  });
});

describe('parseCertifyRequest', () => {
  it('rejects an empty attempt without gaveUp', () => {
    expect(parseCertifyRequest({ attempt: '' }).ok).toBe(false);
    expect(parseCertifyRequest({ attempt: '   ' }).ok).toBe(false);
    expect(parseCertifyRequest({}).ok).toBe(false);
    expect(parseCertifyRequest({ gaveUp: false }).ok).toBe(false);
  });

  it('accepts gaveUp with no attempt and drops any attempt sent with it', () => {
    expect(parseCertifyRequest({ gaveUp: true })).toEqual({
      ok: true,
      value: { attempt: null, gaveUp: true, mode: 'typed' },
    });
    const r = parseCertifyRequest({ gaveUp: true, attempt: 'ignored' });
    expect(r.ok && r.value.attempt).toBeNull();
  });

  it('trims the attempt and defaults mode to typed', () => {
    expect(parseCertifyRequest({ attempt: '  Obrigado!  ' })).toEqual({
      ok: true,
      value: { attempt: 'Obrigado!', gaveUp: false, mode: 'typed' },
    });
  });

  it('carries mode through and rejects an unknown one', () => {
    const r = parseCertifyRequest({ attempt: 'boa noite', mode: 'spoken' });
    expect(r.ok && r.value.mode).toBe('spoken');
    expect(parseCertifyRequest({ attempt: 'x', mode: 'telepathy' }).ok).toBe(false);
  });

  it('rejects an over-long attempt and non-object bodies', () => {
    expect(parseCertifyRequest({ attempt: 'a'.repeat(501) }).ok).toBe(false);
    expect(parseCertifyRequest(null).ok).toBe(false);
    expect(parseCertifyRequest('hi').ok).toBe(false);
  });
});

describe('cooldownForFails', () => {
  it('keeps the ladder: 24h for the first two strikes, 72h from the third', () => {
    expect(cooldownForFails(1)).toBe(24);
    expect(cooldownForFails(2)).toBe(24);
    expect(cooldownForFails(3)).toBe(72);
    expect(cooldownForFails(9)).toBe(72);
  });
});

describe('restingFeedback', () => {
  it('names hours, rounded up, never zero', () => {
    expect(restingFeedback('2026-09-30T12:20:00Z', NOW)).toBe('This one is resting for about another hour.');
    expect(restingFeedback('2026-10-01T12:00:00Z', NOW)).toBe('This one is resting for about another 24 hours.');
  });
});

describe('normalizeLoose', () => {
  it('ignores punctuation, casing, accents and spacing (speech transcripts)', () => {
    expect(normalizeLoose('  Você  está bem?! ')).toBe('voce esta bem');
    expect(normalizeLoose('The receptionist hands you your key.')).toBe(
      normalizeLoose('the receptionist hands you your key'),
    );
  });
});
