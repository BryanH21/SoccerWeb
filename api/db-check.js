export const config = { runtime: 'nodejs' };

import { pool } from './_db.js';

export default async function handler(req, res) {
  try {
    const r = await pool.sql`SELECT 1 as ok`;
    res.json({ ok: true, result: r.rows[0], hasEnv: !!process.env.DATABASE_URL });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message, hasEnv: !!process.env.DATABASE_URL });
  }
}