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

  console.log('Creating wordzoo_deployment_events…');
  await sql`
    CREATE TABLE IF NOT EXISTS wordzoo_deployment_events (
      id BIGSERIAL PRIMARY KEY,
      vercel_deployment_id TEXT NOT NULL UNIQUE,
      project_name TEXT NOT NULL,
      state TEXT NOT NULL,
      error_code TEXT,
      error_message TEXT,
      commit_sha TEXT,
      commit_author_email TEXT,
      commit_message TEXT,
      build_url TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_wordzoo_deployment_events_created
      ON wordzoo_deployment_events (created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_wordzoo_deployment_events_state
      ON wordzoo_deployment_events (state)
  `;

  console.log('wordzoo_deployment_events ready.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
