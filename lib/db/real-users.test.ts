import { describe, it, expect } from 'vitest';
import { maskEmail, realUserOnly, activeLanguageId, TEST_USER_EMAIL_LIKE } from './real-users';

describe('maskEmail', () => {
  it('keeps the first three characters and hides the rest', () => {
    expect(maskEmail('profbenjo@gmail.com')).toBe('pro***');
  });
  it('never leaks a short address', () => {
    expect(maskEmail('a@b.co')).toBe('a@b***');
    expect(maskEmail('ab')).toBe('ab***');
  });
});

describe('SQL fragments', () => {
  it('realUserOnly excludes the test domain and keeps orphaned rows', () => {
    const f = realUserOnly('uw.user_id');
    expect(f).toContain('NOT EXISTS');
    expect(f).toContain('tu.id = uw.user_id');
    expect(f).toContain(TEST_USER_EMAIL_LIKE);
  });
  it('activeLanguageId reads the active user_path for the given user column', () => {
    const f = activeLanguageId('uw.user_id');
    expect(f).toContain("aup.status = 'active'");
    expect(f).toContain('aup.user_id = uw.user_id');
  });
});
