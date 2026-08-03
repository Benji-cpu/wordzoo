import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

/**
 * One-off migration: measurement-layer indexes + the phase_step/phase_batch
 * drift repair. Idempotent.
 *
 * Exists separately from lib/db/migrate.ts because the full schema migration
 * aborts on a pre-existing constraint conflict; this targeted script applies
 * just the new statements without fighting that.
 *
 * Run: npx tsx lib/db/apply-pedagogy-measurement.ts
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  // Drift repair — these already exist in production (applied by
  // apply-scene-progress-v2-state.ts) but were missing from schema.ts.
  console.log('Ensuring user_scene_progress.phase_step…');
  await sql`ALTER TABLE user_scene_progress ADD COLUMN IF NOT EXISTS phase_step TEXT`;
  console.log('Ensuring user_scene_progress.phase_batch…');
  await sql`ALTER TABLE user_scene_progress ADD COLUMN IF NOT EXISTS phase_batch INTEGER NOT NULL DEFAULT 0`;

  console.log('Creating idx_user_words_next_review…');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_words_next_review
      ON user_words(next_review_at) WHERE status <> 'new'
  `;
  console.log('Creating idx_user_phrases_next_review…');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_phrases_next_review
      ON user_phrases(next_review_at) WHERE status <> 'new'
  `;
  console.log('Creating idx_user_scene_progress_completed…');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_scene_progress_completed
      ON user_scene_progress(completed_at) WHERE completed_at IS NOT NULL
  `;

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
