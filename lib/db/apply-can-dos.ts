import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

/**
 * One-off migration: the capability layer (can_dos + user_can_dos). Idempotent.
 *
 * See lib/db/schema.ts for the why. Short version: everything else in the
 * schema counts throughput; these two tables record what a learner can
 * actually do, certified by a delayed unaided test.
 *
 * Run: npx tsx lib/db/apply-can-dos.ts
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log('Creating can_dos…');
  await sql`
    CREATE TABLE IF NOT EXISTS can_dos (
      id UUID PRIMARY KEY,
      scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      statement_en TEXT NOT NULL,
      prompt_en TEXT NOT NULL,
      reference_target TEXT NOT NULL,
      accept_notes TEXT,
      must_include TEXT[] NOT NULL DEFAULT '{}',
      sort_order INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'ai_generated',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_can_dos_scene ON can_dos(scene_id, sort_order)`;

  console.log('Creating user_can_dos…');
  await sql`
    CREATE TABLE IF NOT EXISTS user_can_dos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      can_do_id UUID NOT NULL REFERENCES can_dos(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'unlocked' CHECK (status IN ('unlocked','certified')),
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      eligible_at TIMESTAMPTZ NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      fails INTEGER NOT NULL DEFAULT 0,
      certified_at TIMESTAMPTZ,
      last_attempt_at TIMESTAMPTZ,
      last_attempt_text TEXT,
      last_verdict TEXT CHECK (last_verdict IN ('pass','fail','unclear')),
      last_feedback TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, can_do_id)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_can_dos_due
      ON user_can_dos(user_id, eligible_at) WHERE status = 'unlocked'
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_can_dos_certified
      ON user_can_dos(user_id, certified_at DESC) WHERE status = 'certified'
  `;

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
