import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

/**
 * One-off migration: user_phrases.direction. Idempotent.
 *
 * user_words has always had this column; user_phrases never did, so the review
 * queue could not alternate a phrase between recognition and production even
 * though PhraseReviewCard already renders both modes. Without it the phrase
 * "mode" is decorative.
 *
 * Run: npx tsx lib/db/apply-review-direction.ts
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log('Adding user_phrases.direction…');
  await sql`
    ALTER TABLE user_phrases ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL
      DEFAULT 'recognition'
  `;
  // Added separately so a re-run against a table that already has the column
  // doesn't fail on a duplicate constraint.
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_phrases_direction_check'
      ) THEN
        ALTER TABLE user_phrases ADD CONSTRAINT user_phrases_direction_check
          CHECK (direction IN ('recognition','production','both'));
      END IF;
    END $$
  `;

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
