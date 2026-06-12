import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

/**
 * One-off migration: email reminder preference + unsubscribe token. Idempotent.
 * Run: npx tsx lib/db/apply-email-prefs.ts
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log('Adding users.email_reminders_enabled…');
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE`;
  console.log('Adding users.unsubscribe_token…');
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid()`;
  console.log('Done.');
}

main();
