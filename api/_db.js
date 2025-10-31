// /api/_db.js
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // ok for Neon/Vercel
});

// Parameterized query helper: query('SELECT * FROM users WHERE id = $1', [id])
export async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res; // { rows, rowCount, ... }
}

// Optional: default export if any older files import default
export default pool;