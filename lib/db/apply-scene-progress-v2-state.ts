import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log('Adding phase_step + phase_batch to user_scene_progress…');
  await sql`ALTER TABLE user_scene_progress ADD COLUMN IF NOT EXISTS phase_step text`;
  await sql`ALTER TABLE user_scene_progress ADD COLUMN IF NOT EXISTS phase_batch integer NOT NULL DEFAULT 0`;
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
