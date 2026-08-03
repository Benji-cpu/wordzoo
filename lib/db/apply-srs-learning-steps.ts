import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

/**
 * One-off migration: SRS learning steps + a real lapse counter.
 *
 *   learning_step  0 = awaiting the 10-min step, 1 = awaiting graduation,
 *                  2 = graduated (on a real interval_days schedule)
 *   lapses         failures of an already-graduated item; drives leech capping
 *
 * `interval_days` is an INTEGER and cannot express "10 minutes", so it now
 * means strictly *the graduated interval* and `next_review_at` (already
 * TIMESTAMPTZ) does the sub-day timing.
 *
 * Also repairs schema drift: `mastery_stage` exists on both tables in
 * production (added by apply-pedagogy-v2-tables.ts) but appears nowhere in
 * schema.ts, so a database built from schema.ts alone is missing it.
 *
 * Idempotent. Run: npx tsx lib/db/apply-srs-learning-steps.ts
 * MUST run against production BEFORE the matching commit is pushed —
 * getOrCreateUserWord's RETURNING names these columns, and Vercel auto-deploys
 * on push, so every review 500s in the gap.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log('Adding learning_step + lapses to user_words…');
  await sql`ALTER TABLE user_words ADD COLUMN IF NOT EXISTS learning_step SMALLINT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE user_words ADD COLUMN IF NOT EXISTS lapses INTEGER NOT NULL DEFAULT 0`;

  console.log('Adding learning_step + lapses to user_phrases…');
  await sql`ALTER TABLE user_phrases ADD COLUMN IF NOT EXISTS learning_step SMALLINT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE user_phrases ADD COLUMN IF NOT EXISTS lapses INTEGER NOT NULL DEFAULT 0`;

  console.log('Drift repair: mastery_stage…');
  await sql`ALTER TABLE user_words ADD COLUMN IF NOT EXISTS mastery_stage TEXT`;
  await sql`ALTER TABLE user_phrases ADD COLUMN IF NOT EXISTS mastery_stage TEXT`;

  // Anything already reviewed is past the learning phase. This backfill is
  // load-bearing in both directions: defaulting the column to 2 would make
  // brand-new rows skip the learning step, and leaving existing rows at 0
  // would send every mastered word back to a 10-minute re-ask.
  console.log('Backfilling learning_step = 2 for already-reviewed items…');
  const w = await sql`
    UPDATE user_words SET learning_step = 2
    WHERE learning_step = 0 AND (times_reviewed > 0 OR interval_days > 0)
  `;
  const p = await sql`
    UPDATE user_phrases SET learning_step = 2
    WHERE learning_step = 0 AND (times_reviewed > 0 OR interval_days > 0)
  `;
  console.log(`  user_words: ${w.length ?? 0} rows, user_phrases: ${p.length ?? 0} rows (0 = already backfilled)`);

  console.log('Indexing leeches…');
  await sql`CREATE INDEX IF NOT EXISTS idx_user_words_leech ON user_words(user_id) WHERE lapses >= 6`;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_phrases_leech ON user_phrases(user_id) WHERE lapses >= 6`;

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
