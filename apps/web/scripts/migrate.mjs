import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const migrationDirectory = resolve(root, 'supabase/migrations');
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

  if (process.argv[2] === 'rollback') {
    const result = await pool.query(
      'SELECT name FROM schema_migrations ORDER BY name DESC LIMIT 1',
    );
    const name = result.rows[0]?.name;
    if (!name) {
      console.log('No migration to roll back.');
    } else {
      const downSql = await readFile(
        resolve(migrationDirectory, `${name}.down.sql`),
        'utf8',
      );
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(downSql);
        await client.query('DELETE FROM schema_migrations WHERE name = $1', [
          name,
        ]);
        await client.query('COMMIT');
        console.log(`Rolled back ${name}.`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  } else {
    const files = (await readdir(migrationDirectory))
      .filter((file) => file.endsWith('.sql') && !file.endsWith('.down.sql'))
      .sort();
    for (const name of files) {
      const applied = await pool.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [name],
      );
      if (applied.rowCount) continue;

      const sql = await readFile(resolve(migrationDirectory, name), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
          name,
        ]);
        await client.query('COMMIT');
        console.log(`Applied ${name}.`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }
} finally {
  await pool.end();
}
