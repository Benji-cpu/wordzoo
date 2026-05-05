import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

/**
 * One-off migration script: creates the two Pedagogy v2 tables.
 * Idempotent (CREATE TABLE IF NOT EXISTS). Run once locally and once
 * against the production DATABASE_URL. Exists separately from
 * `lib/db/migrate.ts` because the full schema migration currently aborts
 * on a pre-existing constraint conflict; this targeted script lets us
 * apply just the two new tables without fighting that.
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log('Creating scene_conversation_prompts…');
  await sql`
    CREATE TABLE IF NOT EXISTS scene_conversation_prompts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      prompt_text TEXT NOT NULL,
      prompt_en TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'gemini',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_scene_conversation_prompts_scene
      ON scene_conversation_prompts(scene_id, sort_order)
  `;

  console.log('Creating pedagogy_events…');
  await sql`
    CREATE TABLE IF NOT EXISTS pedagogy_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      event TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_pedagogy_events_user_created
      ON pedagogy_events(user_id, created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_pedagogy_events_event_created
      ON pedagogy_events(event, created_at DESC)
  `;

  console.log('Pedagogy v2 tables ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
