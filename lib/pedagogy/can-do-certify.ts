/**
 * Pure decisions for the can-do certify route. No DB, no model, no clock of its
 * own: the route passes `now`, so every branch is testable.
 *
 * The route used to answer state with a raw 403 ('Already certified',
 * 'Not yet eligible'). A duplicate POST after a pass therefore looked like a
 * failure to the client, and a learner with no way to say "I don't know" burned
 * a strike typing English. State is now a normal 200 result, never an error.
 */

import { z } from 'zod/v4';
import { normalizeForCompare } from './normalize';

/** Rest after "I don't know": long enough to study, short enough not to punish. */
export const GIVE_UP_COOLDOWN_HOURS = 12;

/** Hours before a failed can-do can be retried. Escalates a little on repeats. */
export function cooldownForFails(failCount: number): number {
  return failCount >= 3 ? 72 : 24;
}

export type CertifyMode = 'spoken' | 'typed';

export interface CertifyRequest {
  attempt: string | null;
  gaveUp: boolean;
  mode: CertifyMode;
}

const RequestSchema = z.object({
  attempt: z.string().trim().max(500).optional(),
  gaveUp: z.boolean().optional(),
  mode: z.enum(['spoken', 'typed']).optional(),
});

/** attempt is required unless the learner gave up. */
export function parseCertifyRequest(
  raw: unknown,
): { ok: true; value: CertifyRequest } | { ok: false; error: string } {
  const parsed = RequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Invalid request body' };
  const { attempt, gaveUp, mode } = parsed.data;
  if (!gaveUp && !attempt) return { ok: false, error: 'Invalid request body' };
  return {
    ok: true,
    value: {
      attempt: gaveUp ? null : (attempt ?? null),
      gaveUp: !!gaveUp,
      mode: mode ?? 'typed',
    },
  };
}

export type CertifyDecision =
  | { action: 'return_settled'; status: 'certified' }
  | { action: 'return_settled'; status: 'resting'; nextEligibleAt: string }
  | { action: 'give_up'; cooldownHours: number }
  | { action: 'grade' };

/**
 * What to do for a request given the row. Certified wins over everything (a
 * duplicate POST must never reopen a passed can-do); resting wins over give-up
 * and grading (no model call, no strike, no clock reset while it is resting).
 */
export function decideCertifyAction(
  row: { status: string; eligibleAt: string },
  req: { gaveUp: boolean },
  now: number,
): CertifyDecision {
  if (row.status === 'certified') return { action: 'return_settled', status: 'certified' };
  const eligibleMs = Date.parse(row.eligibleAt);
  if (Number.isFinite(eligibleMs) && eligibleMs > now) {
    return {
      action: 'return_settled',
      status: 'resting',
      nextEligibleAt: new Date(eligibleMs).toISOString(),
    };
  }
  if (req.gaveUp) return { action: 'give_up', cooldownHours: GIVE_UP_COOLDOWN_HOURS };
  return { action: 'grade' };
}

/** Timezone-free, because the server doesn't know the learner's. */
export function restingFeedback(nextEligibleAt: string, now: number): string {
  const hours = Math.max(1, Math.ceil((Date.parse(nextEligibleAt) - now) / 3_600_000));
  return hours === 1
    ? 'This one is resting for about another hour.'
    : `This one is resting for about another ${hours} hours.`;
}

/** Punctuation-, case- and accent-blind, for speech transcripts and prompt-echo checks. */
export function normalizeLoose(value: string): string {
  return normalizeForCompare(value)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
