const { Pool } = require('pg');
const pool = new Pool({
  host: 'park-api-dev.cewquycg3zud.eu-west-1.rds.amazonaws.com',
  port: 5432,
  database: 'auth',
  user: 'parktech',
  password: 't!Q$FPAx49bBxs3p',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const tables = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' ORDER BY tablename
    `);
    console.log('=== ALL PUBLIC TABLES ===');
    for (const t of tables.rows) {
      const cols = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [t.tablename]);
      console.log(`\n--- ${t.tablename} ---`);
      cols.rows.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | nullable: ${c.is_nullable} | default: ${c.column_default || '-'}`));
    }

    // Foreign keys
    const fks = await pool.query(`
      SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    `);
    console.log('\n=== FOREIGN KEYS ===');
    fks.rows.forEach(r => console.log(`${r.table_name}.${r.column_name} -> ${r.foreign_table}.${r.foreign_column}`));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
