export const config = { runtime: 'nodejs' };

import { sql } from './_db.js';
import { verifyPassword, newSessionToken } from './_crypto.js';
import { setSessionCookie } from './_session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const u = String(username).trim();
    const p = String(password);

    const rows = await sql/*sql*/`
      SELECT id, password_hash, role
      FROM users
      WHERE username = ${u}
      LIMIT 1;
    `;
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const { id, password_hash, role } = rows[0];

    const ok = await verifyPassword(p, password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = newSessionToken();
    const expires = new Date(Date.now() + 12 * 3600 * 1000); // 12h
    await sql/*sql*/`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${id}, ${token}, ${expires.toISOString()});
    `;

    setSessionCookie(res, token);
    res.json({ ok: true, role });
  } catch (e) {
    console.error('LOGIN ERROR:', e);
    res.status(500).json({ error: 'Server error' });
  }
}