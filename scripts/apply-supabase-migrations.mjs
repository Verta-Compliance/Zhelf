import pg from 'pg';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));

for (const envPath of [
  resolve(rootDir, '.env'),
  resolve(rootDir, 'apps/web/.env'),
  resolve(rootDir, 'apps/web/.env.local'),
]) {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Ignore missing env files.
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Configure a valid PostgreSQL connection string in the current environment before running migrations.',
  );
}

const pool = new Pool({ connectionString });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const migrationDir = resolve(rootDir, 'supabase/migrations');
  const files = readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql') && !file.endsWith('.down.sql'))
    .sort();

  for (const file of files) {
    const alreadyApplied = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE name = $1',
      [file],
    );

    if (alreadyApplied.rowCount) {
      continue;
    }

    const sql = readFileSync(resolve(migrationDir, file), 'utf8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        file,
      ]);
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
