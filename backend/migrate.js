const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigration(file) {
  const sql = fs.readFileSync(file, 'utf8');
  const client = new Client();
  try {
    await client.connect();
    console.log('Connected to Postgres, running migration:', file);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

const migrationsDir = path.join(__dirname, 'migrations');
const migrationFile = path.join(migrationsDir, '001_add_is_internal_and_indexes.sql');
if (!fs.existsSync(migrationFile)) {
  console.error('Migration file not found:', migrationFile);
  process.exit(1);
}

runMigration(migrationFile).catch((e) => {
  console.error('Unexpected error:', e);
  process.exitCode = 1;
});
