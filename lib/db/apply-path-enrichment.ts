import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

/**
 * One-off migration: adds paths.enrichment_status for the async
 * mnemonic/audio enrichment of AI-generated paths. Idempotent.
 * Run: npx tsx lib/db/apply-path-enrichment.ts
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  console.log('Adding paths.enrichment_status…');
  await sql`ALTER TABLE paths ADD COLUMN IF NOT EXISTS enrichment_status TEXT NOT NULL DEFAULT 'none'`;
  console.log('Done.');
}

main();
