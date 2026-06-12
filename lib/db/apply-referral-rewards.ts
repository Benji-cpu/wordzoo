import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

/**
 * One-off migration: referral reward columns. Idempotent.
 * Run: npx tsx lib/db/apply-referral-rewards.ts
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log('Adding users.bonus_premium_until…');
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_premium_until TIMESTAMPTZ`;
  console.log('Adding referrals.rewarded_at…');
  await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS rewarded_at TIMESTAMPTZ`;
  console.log('Done.');
}

main();
