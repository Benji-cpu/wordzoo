import { Pool } from '@neondatabase/serverless';
import { CREATE_TABLES_SQL } from './schema';

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  console.log('Running migrations...');
  try {
    await pool.query(CREATE_TABLES_SQL);
    console.log('All tables created successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
