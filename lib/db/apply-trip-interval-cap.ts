import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
// Pure module, no DB import: ES imports hoist above dotenv.config(), so anything
// that reached lib/db/client.ts would throw before DATABASE_URL is loaded.
import { tripDaysLeft, tripBulkCap } from '../srs/trip';

/**
 * One-off repair: bring existing schedules in line with the trip (design v2,
 * "Repairs to Ben's data"). For every user with a future trip_date, restricted
 * to that user's ACTIVE path language, words and phrases:
 *
 *  (a) rows last reviewed on 29 Sep (UTC or Bali time, see REPAIR_FROM) whose interval jumped to >= 51
 *      days: 13 self-rated "Easy" taps 3-5 s apart sent items to 365 days, and
 *      that wasn't recall. interval = the trip cap, due NOW, so they come back
 *      as a spoken check in the first sitting.
 *  (b) every other row with interval_days > cap: interval = cap (spread
 *      downward so a cohort doesn't lump), due no later than last review + that
 *      interval.
 *
 * status, learning_step, ease and lapses are never touched, so "mastered"
 * survives the cap. Idempotent: a re-run finds nothing over the cap.
 *
 * Dry-run by default (SELECT only). Run: npx tsx lib/db/apply-trip-interval-cap.ts [--apply]
 * Ship the engine change BEFORE applying, or the next review re-inflates them.
 */

// timestamptz literals: no JS Date, so the Mac's UTC+8 can't shift the day. The window is
// 29 Sep in UTC AND in Ben's Bali day (UTC+8, which starts 28 Sep 16:00Z), so it holds
// whichever way "29 Sep" was read. Ben hadn't reviewed since 11 Aug, so nothing older
// than his 29 Sep sitting can carry a >= 51 d interval into it.
const REPAIR_FROM = '2026-09-28T16:00:00Z';
const REPAIR_TO = '2026-09-30T00:00:00Z';
const JUMP_FROM_DAYS = 51;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);
  const apply = process.argv.includes('--apply');
  console.log(`=== Trip interval cap repair (${apply ? 'APPLY' : 'dry run'}) ===\n`);

  const users = (await sql`
    SELECT id, email, to_char(trip_date, 'YYYY-MM-DD') AS trip_date
    FROM users
    WHERE trip_date > (NOW() AT TIME ZONE 'UTC')::date
  `) as { id: string; email: string; trip_date: string }[];
  console.log(`${users.length} user(s) with a future trip date\n`);

  const totals = { a: 0, b: 0 };
  for (const u of users) {
    const daysLeft = tripDaysLeft(u.trip_date, new Date());
    const cap = tripBulkCap(daysLeft);
    console.log(`-- ${u.email}: trip ${u.trip_date}, ${daysLeft} days left, cap ${cap ?? 'none'}`);
    if (cap == null) continue;
    const width = Math.max(1, Math.round(cap * 0.1));

    const lang = (await sql`
      SELECT p.language_id, l.code
      FROM user_paths up
      JOIN paths p ON p.id = up.path_id
      JOIN languages l ON l.id = p.language_id
      WHERE up.user_id = ${u.id} AND up.status = 'active'
      ORDER BY up.started_at DESC LIMIT 1
    `) as { language_id: string; code: string }[];
    if (!lang[0]) {
      console.log('   no active path: skipped');
      continue;
    }
    const languageId = lang[0].language_id;
    console.log(`   active language ${lang[0].code}`);

    // What would change, classified the same way the UPDATEs below select.
    const wordRows = (await sql`
      SELECT uw.id, w.text AS label, uw.interval_days, uw.status,
        to_char(uw.last_reviewed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS last_reviewed,
        to_char(uw.next_review_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS next_review,
        (uw.interval_days >= ${JUMP_FROM_DAYS}
          AND uw.last_reviewed_at >= ${REPAIR_FROM}::timestamptz
          AND uw.last_reviewed_at < ${REPAIR_TO}::timestamptz) AS is_a
      FROM user_words uw JOIN words w ON w.id = uw.word_id
      WHERE uw.user_id = ${u.id} AND w.language_id = ${languageId} AND uw.interval_days > ${cap}::int
      ORDER BY uw.interval_days DESC
    `) as Row[];
    const phraseRows = (await sql`
      SELECT up.id, sp.text_target AS label, up.interval_days, up.status,
        to_char(up.last_reviewed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS last_reviewed,
        to_char(up.next_review_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS next_review,
        (up.interval_days >= ${JUMP_FROM_DAYS}
          AND up.last_reviewed_at >= ${REPAIR_FROM}::timestamptz
          AND up.last_reviewed_at < ${REPAIR_TO}::timestamptz) AS is_a
      FROM user_phrases up
      JOIN scene_phrases sp ON sp.id = up.phrase_id
      JOIN scenes s ON s.id = sp.scene_id
      JOIN paths p ON p.id = s.path_id
      WHERE up.user_id = ${u.id} AND p.language_id = ${languageId} AND up.interval_days > ${cap}::int
      ORDER BY up.interval_days DESC
    `) as Row[];
    report('words', wordRows);
    report('phrases', phraseRows);

    if (!apply) continue;

    // (a) first, so (b) doesn't see those rows again (interval = cap, not > cap).
    const aWords = await sql`
      UPDATE user_words uw SET interval_days = ${cap}::int, next_review_at = NOW(), updated_at = NOW()
      FROM words w
      WHERE w.id = uw.word_id AND uw.user_id = ${u.id} AND w.language_id = ${languageId}
        AND uw.interval_days >= ${JUMP_FROM_DAYS} AND uw.interval_days > ${cap}::int
        AND uw.last_reviewed_at >= ${REPAIR_FROM}::timestamptz AND uw.last_reviewed_at < ${REPAIR_TO}::timestamptz
      RETURNING uw.id
    `;
    const aPhrases = await sql`
      UPDATE user_phrases up SET interval_days = ${cap}::int, next_review_at = NOW(), updated_at = NOW()
      FROM scene_phrases sp, scenes s, paths p
      WHERE sp.id = up.phrase_id AND s.id = sp.scene_id AND p.id = s.path_id
        AND up.user_id = ${u.id} AND p.language_id = ${languageId}
        AND up.interval_days >= ${JUMP_FROM_DAYS} AND up.interval_days > ${cap}::int
        AND up.last_reviewed_at >= ${REPAIR_FROM}::timestamptz AND up.last_reviewed_at < ${REPAIR_TO}::timestamptz
      RETURNING up.id
    `;
    // random() makes the CTE materialise, so each row gets one spread value.
    const bWords = await sql`
      WITH tgt AS (
        SELECT uw.id, GREATEST(1, ${cap}::int - floor(random() * ${width})::int) AS iv
        FROM user_words uw JOIN words w ON w.id = uw.word_id
        WHERE uw.user_id = ${u.id} AND w.language_id = ${languageId} AND uw.interval_days > ${cap}::int
      )
      UPDATE user_words uw SET
        interval_days = t.iv,
        next_review_at = LEAST(uw.next_review_at, COALESCE(uw.last_reviewed_at, NOW()) + t.iv * interval '1 day'),
        updated_at = NOW()
      FROM tgt t WHERE uw.id = t.id
      RETURNING uw.id
    `;
    const bPhrases = await sql`
      WITH tgt AS (
        SELECT up.id, GREATEST(1, ${cap}::int - floor(random() * ${width})::int) AS iv
        FROM user_phrases up
        JOIN scene_phrases sp ON sp.id = up.phrase_id
        JOIN scenes s ON s.id = sp.scene_id
        JOIN paths p ON p.id = s.path_id
        WHERE up.user_id = ${u.id} AND p.language_id = ${languageId} AND up.interval_days > ${cap}::int
      )
      UPDATE user_phrases up SET
        interval_days = t.iv,
        next_review_at = LEAST(up.next_review_at, COALESCE(up.last_reviewed_at, NOW()) + t.iv * interval '1 day'),
        updated_at = NOW()
      FROM tgt t WHERE up.id = t.id
      RETURNING up.id
    `;
    console.log(
      `   written: (a) ${aWords.length} words + ${aPhrases.length} phrases due now; ` +
        `(b) ${bWords.length} words + ${bPhrases.length} phrases capped`
    );
    totals.a += aWords.length + aPhrases.length;
    totals.b += bWords.length + bPhrases.length;
  }

  if (apply) {
    console.log(`\nDone. (a) ${totals.a} rows set due now, (b) ${totals.b} rows capped.`);
  } else {
    console.log('\nDRY RUN: nothing written. Re-run with --apply to write.');
  }
}

interface Row {
  id: string;
  label: string;
  interval_days: number;
  status: string;
  last_reviewed: string | null;
  next_review: string | null;
  is_a: boolean;
}

function report(kind: string, rows: Row[]) {
  const a = rows.filter((r) => r.is_a);
  const b = rows.filter((r) => !r.is_a);
  console.log(`   ${kind}: ${rows.length} over the cap: (a) ${a.length} due-now checks, (b) ${b.length} capped`);
  for (const [name, list] of [['a', a], ['b', b]] as const) {
    for (const r of list.slice(0, 5)) {
      console.log(
        `     [${name}] ${r.label} ${r.interval_days}d ${r.status} last ${r.last_reviewed ?? '-'} next ${r.next_review ?? '-'}`
      );
    }
    if (list.length > 5) console.log(`     [${name}] ... ${list.length - 5} more`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
