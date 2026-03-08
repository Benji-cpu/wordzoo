import { neon, Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// For quick one-off queries (serverless-friendly)
export const sql = neon(process.env.DATABASE_URL);

// Connection pool for Auth.js adapter and complex transactions
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
