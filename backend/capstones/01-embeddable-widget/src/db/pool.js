const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  // A dead idle client should not crash the whole process.
  console.error('[db] unexpected error on idle client', err);
});

module.exports = pool;
