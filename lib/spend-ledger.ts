/**
 * Durable spend ledger — the pure half of the spend guard.
 *
 * Imports nothing but the DB client, so it is safe to use from the edge
 * runtime (the Neon HTTP driver is fetch-based). lib/spend-guard.ts layers the
 * auth-aware route wrappers on top; importing THAT from an edge route would
 * pull NextAuth and the billing service into the edge bundle.
 */

import { sql } from '@/lib/db/client';

/**
 * Every metered operation. Keeping the union closed means a typo is a compile
 * error rather than a silently unlimited endpoint.
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
  | 'can_do_certify'
  | 'xp_award'
  | 'tts_synthesize';

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
  // Certification is rare by construction — a can-do unlocks once per scene and
  // is gated 48h out, with a 24h cooldown after a failure. 40/day is far above
  // honest use and caps the cost of someone hammering the endpoint.
  can_do_certify: { limit: 40, windowMinutes: 1440 },
  xp_award: { limit: 3000, windowMinutes: 1440 },
  // Only charged on a cache MISS — the app speaks a small fixed vocabulary of
  // phrasings, so after the first few sessions almost every line is a free blob
  // lookup. 200/day is far above the number of genuinely new sentences one
  // learner can generate, and caps the damage if a caller ever loops.
  tts_synthesize: { limit: 200, windowMinutes: 1440 },
};

/**
 * Atomically claim `units` against a rolling window.
 *
 * The whole point is that the SELECT and the INSERT are one statement: the row
 * only lands if the window still has room, evaluated by Postgres under the
 * insert's own snapshot. So N concurrent lambdas serialize through the
 * database instead of each seeing a fresh in-memory bucket.
 *
 * Charges first, then the caller does the expensive work — a request that
 * fails afterwards has paid for a slot it didn't use, which is the right bias.
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
