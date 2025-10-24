export const config = { runtime: 'nodejs' };
import { pool } from './_db';
import { verifyPassword, newSessionToken } from './_crypto';
import { setSessionCookie } from './_session';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { username, password } = req.body || {};
  const client = await pool.connect();
  try {
    const r = await client.sql`SELECT id, password_hash FROM users WHERE username=${username} LIMIT 1`;
    if (r.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const { id, password_hash } = r.rows[0];
    const ok = await verifyPassword(password, password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = newSessionToken();
    const expires = new Date(Date.now() + 12 * 3600 * 1000);
    await client.sql`INSERT INTO sessions (user_id, token, expires_at) VALUES (${id}, ${token}, ${expires.toISOString()})`;
    setSessionCookie(res, token);
    res.json({ ok: true });
  } finally {
    client.release();
  }
}