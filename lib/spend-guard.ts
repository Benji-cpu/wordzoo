/**
 * Durable spend guard for operations that cost real money.
 *
 * Replaces the in-memory token bucket that used to live in lib/rate-limit.ts.
 * That bucket was a module-scope Map, so on Vercel every concurrent lambda got
 * its own copy — the effective ceiling scaled with the caller's concurrency,
 * which is the opposite of a rate limit.
 *
 * This one claims a row in `spend_events` with a single atomic conditional
 * insert, so N concurrent lambdas serialize through Postgres instead of each
 * seeing a fresh bucket. The insert IS the check: it charges first, then the
 * caller does the expensive work. A request that fails after claiming has
 * simply paid for a slot it didn't use, which is the correct bias.
 *
 * Shape mirrors the DB-backed limiter already trusted in
 * lib/services/app-feedback-service.ts (per-user window, admin-exempt).
 */

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/auth/admin';
import { checkAccess } from '@/lib/services/billing-service';
import type { ApiResponse, BillingFeature } from '@/types/api';

/**
 * Every metered operation. Adding a kind here costs nothing — the ledger is
 * schemaless on `kind` — but keeping the union closed means a typo is a
 * compile error rather than a silently unlimited endpoint.
 */
export type SpendKind =
  | 'mnemonic_generate'
  | 'mnemonic_custom'
  | 'mnemonic_regenerate'
  | 'path_generate'
  | 'studio_chat'
  | 'path_enrich_word'
  | 'trip_preview'
  | 'conversation_grade'
  | 'studio_suggestions'
  | 'tutor_greeting'
  | 'screenshot_upload'
  | 'share_image'
  | 'xp_award';

export interface SpendLimit {
  /** Max units allowed inside the window. */
  limit: number;
  /** Rolling window length in minutes. */
  windowMinutes: number;
  /** Units this call consumes (default 1). */
  units?: number;
}

/**
 * Default budgets, sized for real use with headroom, then a hard stop.
 *
 * `mnemonic_generate` is the one that matters most: IntroduceBatch fires it in
 * parallel for every word in a scene that lacks a mnemonic, so a render loop
 * there is exactly how the Blob store filled up. 60/day is ~6 fully-unenriched
 * scenes — well above genuine use, and a firm ceiling on runaway generation.
 */
export const SPEND_LIMITS: Record<SpendKind, SpendLimit> = {
  mnemonic_generate: { limit: 60, windowMinutes: 1440 },
  mnemonic_custom: { limit: 10, windowMinutes: 1440 },
  mnemonic_regenerate: { limit: 20, windowMinutes: 1440 },
  path_generate: { limit: 5, windowMinutes: 1440 },
  studio_chat: { limit: 100, windowMinutes: 1440 },
  path_enrich_word: { limit: 250, windowMinutes: 1440 },
  trip_preview: { limit: 3, windowMinutes: 60 },
  conversation_grade: { limit: 120, windowMinutes: 1440 },
  studio_suggestions: { limit: 30, windowMinutes: 1440 },
  tutor_greeting: { limit: 30, windowMinutes: 1440 },
  screenshot_upload: { limit: 10, windowMinutes: 60 },
  share_image: { limit: 60, windowMinutes: 60 },
  xp_award: { limit: 3000, windowMinutes: 1440 },
};

/**
 * Atomically claim `units` against a rolling window.
 *
 * The whole point is that the SELECT and the INSERT are one statement: the row
 * only lands if the window still has room, evaluated by Postgres under the
 * insert's own snapshot. Returns false when the budget is spent.
 */
export async function claimSpend(
  subject: string,
  kind: SpendKind,
  limit?: Partial<SpendLimit>,
): Promise<boolean> {
  const cfg = { ...SPEND_LIMITS[kind], ...limit };
  const units = Math.max(1, Math.floor(cfg.units ?? 1));

  const rows = await sql`
    INSERT INTO spend_events (subject, kind, units)
    SELECT ${subject}, ${kind}, ${units}
    WHERE (
      SELECT COALESCE(SUM(units), 0)
      FROM spend_events
      WHERE subject = ${subject}
        AND kind = ${kind}
        AND created_at > NOW() - (${cfg.windowMinutes} * INTERVAL '1 minute')
    ) + ${units} <= ${cfg.limit}
    RETURNING id
  `;
  return rows.length > 0;
}

/** Roll up spend by kind over a window — feeds the nightly digest. */
export async function getSpendRollup(
  windowHours = 24,
): Promise<Array<{ kind: string; units: number; calls: number }>> {
  const rows = await sql`
    SELECT kind, SUM(units)::int AS units, COUNT(*)::int AS calls
    FROM spend_events
    WHERE created_at > NOW() - (${windowHours} * INTERVAL '1 hour')
    GROUP BY kind
    ORDER BY units DESC
  `;
  return rows as Array<{ kind: string; units: number; calls: number }>;
}

/** Prune old ledger rows. Called from the daily reset-usage cron. */
export async function pruneSpendEvents(retentionDays = 30): Promise<void> {
  await sql`
    DELETE FROM spend_events
    WHERE created_at < NOW() - (${retentionDays} * INTERVAL '1 day')
  `;
}

/** First hop of x-forwarded-for. Matches app/invite/[referrerId]/route.ts. */
export function clientIp(request: Request): string {
  const raw = request.headers.get('x-forwarded-for');
  const first = raw?.split(',')[0]?.trim();
  return first && first.length > 0 ? first : 'anonymous';
}

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
 * NOTE: admins bypass the spend claim entirely, which means the limits are
 * invisible to Benji's own accounts. Exercise them with a non-admin account or
 * by temporarily clearing ADMIN_EMAILS.
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
 * endpoints — currently /api/trip/preview (anonymous Gemini) and the public
 * share-image renderer.
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
