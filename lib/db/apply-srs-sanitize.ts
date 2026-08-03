import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

/**
 * One-off repair: pull back schedules that were never earned.
 *
 * Until the source gate landed (see lib/srs/engine.ts), every in-scene drill
 * tap multiplied interval_days by the ease factor. Five taps in one sitting
 * compounded five times. The damage is visible in production:
 *
 *   saya                              interval 9,300 days on a 137-day-old row
 *   apa, baik                         interval   238 days on a 137-day-old row
 *   sou, bom dia, obrigada, sim       interval   105 days on a  62-day-old row
 *
 * A 25-year interval is not a schedule, it is a deletion. And an item cannot
 * honestly be scheduled further out than the learner has known it — you cannot
 * have remembered something for longer than you have owned it. So:
 *
 *   1. Clamp everything to the 365-day ceiling the scheduler now enforces.
 *   2. Where interval_days > 4x the item's age, pull it back to its age.
 *
 * 4x rather than 1x deliberately: a genuinely well-known word legitimately
 * outruns its age a little, and this should only catch the compounding
 * artefacts, not re-teach words the learner really does know.
 *
 * next_review_at is recomputed from last_reviewed_at (falling back to
 * created_at) so the item lands where the corrected interval says it should,
 * rather than all of them stacking onto today.
 *
 * EXPECT THE OVERDUE COUNT TO RISE. Roughly 25 items are currently parked
 * beyond the horizon; correcting them brings them back into the queue. That is
 * the repair working, not a regression — which is why this ships after the
 * review screen learned to report an honest remaining count.
 *
 * Idempotent. Run: npx tsx lib/db/apply-srs-sanitize.ts
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  for (const table of ['user_words', 'user_phrases'] as const) {
    const before = await sql.query(
      `SELECT COUNT(*)::int AS over_cap,
              MAX(interval_days)::int AS max_interval
       FROM ${table} WHERE interval_days > 365`,
    );
    const impossible = await sql.query(
      `SELECT COUNT(*)::int AS n FROM ${table}
       WHERE interval_days > 4 * GREATEST(1, (NOW()::date - created_at::date))`,
    );
    console.log(
      `${table}: ${before[0].over_cap} over the 365d cap (max ${before[0].max_interval ?? 0}), ` +
        `${impossible[0].n} beyond 4x their age`,
    );

    // 1. Clamp to the ceiling the scheduler now enforces.
    await sql.query(
      `UPDATE ${table} SET interval_days = 365, updated_at = NOW()
       WHERE interval_days > 365`,
    );

    // 2. Pull impossible schedules back to the item's actual age.
    await sql.query(
      `UPDATE ${table}
       SET interval_days = GREATEST(1, (NOW()::date - created_at::date)),
           updated_at = NOW()
       WHERE interval_days > 4 * GREATEST(1, (NOW()::date - created_at::date))`,
    );

    // 3. Re-anchor next_review_at to the corrected interval so the queue
    //    drains over time instead of arriving all at once.
    await sql.query(
      `UPDATE ${table}
       SET next_review_at = COALESCE(last_reviewed_at, created_at)
                            + (interval_days || ' days')::interval,
           updated_at = NOW()
       WHERE next_review_at > COALESCE(last_reviewed_at, created_at)
                              + (interval_days || ' days')::interval`,
    );

    const after = await sql.query(
      `SELECT MAX(interval_days)::int AS max_interval,
              COUNT(*) FILTER (
                WHERE interval_days > 4 * GREATEST(1, (NOW()::date - created_at::date))
              )::int AS still_impossible,
              COUNT(*) FILTER (WHERE next_review_at <= NOW() AND status <> 'new')::int AS due_now
       FROM ${table}`,
    );
    console.log(
      `  -> max interval ${after[0].max_interval ?? 0}, ` +
        `${after[0].still_impossible} still beyond 4x age, ${after[0].due_now} now due`,
    );
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
