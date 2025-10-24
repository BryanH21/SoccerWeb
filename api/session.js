export const config = { runtime: 'nodejs' };
import { pool } from './_db';
import { readSessionCookie } from './_session';

export default async function handler(req, res) {
  const token = readSessionCookie(req);
  if (!token) return res.json({ authenticated: false });

  const { rows } = await pool.sql`SELECT user_id, expires_at FROM sessions WHERE token=${token} LIMIT 1`;
  const authed = rows.length && new Date(rows[0].expires_at) > new Date();
  res.json({ authenticated: authed });
}