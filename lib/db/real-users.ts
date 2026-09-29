/**
 * Shared SQL fragments for "real learners only" reporting (nightly digest and
 * /admin/pedagogy). Pure strings, no DB import, so it stays unit-testable.
 *
 * The digest once reported cloze 0/26 and "186 words + 99 phrases 8d+ late"; that was
 * Playwright's test@wordzoo.dev, the strangerN@wordzoo.dev fixtures and abandoned
 * languages, not a learner-facing bug. Every health aggregate goes through these two
 * fragments so the definition of "real" and "backlog" cannot drift between queries.
 * Interpolate with sql.unsafe(...): the column arguments are code constants, never input.
 */

/** Accounts created by tests and smoke fixtures. Same rule as the reminder emails. */
export const TEST_USER_EMAIL_LIKE = '%@wordzoo.dev';

/**
 * WHERE-fragment that is true for real users. Written as NOT EXISTS so events whose
 * user was deleted (user_id NULL) are kept, not silently dropped.
 * `userIdCol` must be qualified (e.g. 'uw.user_id') to avoid resolving inside the subquery.
 */
export function realUserOnly(userIdCol: string): string {
  return `NOT EXISTS (SELECT 1 FROM users tu WHERE tu.id = ${userIdCol} AND tu.email LIKE '${TEST_USER_EMAIL_LIKE}')`;
}

/**
 * Scalar subquery: the language of the user's active path (same source as the review
 * page's getUserActivePath). NULL when they have no active path, so their items count
 * as nobody's backlog rather than every language's.
 */
export function activeLanguageId(userIdCol: string): string {
  return `(SELECT ap.language_id FROM user_paths aup JOIN paths ap ON ap.id = aup.path_id
           WHERE aup.user_id = ${userIdCol} AND aup.status = 'active'
           ORDER BY aup.started_at DESC LIMIT 1)`;
}

/** "abc***": enough to recognise a person in the digest without publishing their address. */
export function maskEmail(email: string): string {
  return `${email.slice(0, 3)}***`;
}
