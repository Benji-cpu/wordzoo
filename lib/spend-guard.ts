/**
 * Route-level spend guards for operations that cost real money.
 *
 * Replaces the in-memory token bucket that used to live in lib/rate-limit.ts.
 * That bucket was a module-scope Map, so on Vercel every concurrent lambda got
 * its own copy — the effective ceiling scaled with the caller's concurrency,
 * which is the opposite of a rate limit.
 *
 * The durable primitive is `claimSpend` in lib/spend-ledger.ts. This module
 * adds auth, the admin bypass, and the optional billing check, in the shape
 * already used by lib/services/app-feedback-service.ts.
 *
 * Edge routes must import from lib/spend-ledger directly — importing this file
 * pulls NextAuth and the billing service into the bundle.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/auth/admin';
import { checkAccess } from '@/lib/services/billing-service';
import { claimSpend, clientIp, type SpendKind, type SpendLimit } from '@/lib/spend-ledger';
import type { ApiResponse, BillingFeature } from '@/types/api';

export {
  claimSpend,
  clientIp,
  getSpendRollup,
  pruneSpendEvents,
  SPEND_LIMITS,
} from '@/lib/spend-ledger';
export type { SpendKind, SpendLimit } from '@/lib/spend-ledger';

export type GuardResult =
  | { ok: true; userId: string; email: string | null; isAdmin: boolean }
  | { ok: false; response: NextResponse };

function deny(error: string, status: number): { ok: false; response: NextResponse } {
  return {
    ok: false,
    response: NextResponse.json<ApiResponse<null>>({ data: null, error }, { status }),
  };
}

export interface GuardOptions extends Partial<SpendLimit> {
  /** Optional free-tier/premium gate applied after the spend claim succeeds. */
  feature?: BillingFeature;
}

/**
 * Authenticated guard: auth -> admin bypass -> durable spend claim -> optional
 * billing check. Returns a ready-to-return response on every failure path so
 * callers stay a single `if (!guard.ok) return guard.response;`.
 *
 * NOTE: admins bypass the spend claim entirely, so the limits are invisible to
 * accounts in ADMIN_EMAILS. Exercise them with a non-admin account or by
 * temporarily clearing ADMIN_EMAILS.
 */
export async function guardSpend(
  kind: SpendKind,
  options: GuardOptions = {},
): Promise<GuardResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return deny('Authentication required', 401);

  const email = session.user?.email ?? null;
  const isAdmin = isAdminEmail(email);

  if (!isAdmin) {
    const claimed = await claimSpend(`user:${userId}`, kind, options);
    if (!claimed) {
      return deny(
        'You have hit the usage limit for this action. Try again later.',
        429,
      );
    }

    if (options.feature) {
      const access = await checkAccess(userId, options.feature);
      if (!access.allowed) {
        return deny(access.upgradeMessage ?? 'Upgrade required', 403);
      }
    }
  }

  return { ok: true, userId, email, isAdmin };
}

/**
 * Unauthenticated guard keyed on client IP. Only for genuinely public
 * endpoints — /api/trip/preview (anonymous Gemini) and the public share-image
 * renderer.
 */
export async function guardAnonymousSpend(
  request: Request,
  kind: SpendKind,
  options: Partial<SpendLimit> = {},
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const claimed = await claimSpend(`ip:${clientIp(request)}`, kind, options);
  if (!claimed) return deny('Rate limit exceeded. Try again shortly.', 429);
  return { ok: true };
}
