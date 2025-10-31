export const config = { runtime: 'nodejs' };

import crypto from 'crypto';
import { query } from './_db.js';
import { verifyPassword } from './_crypto.js';
import { writeSessionCookie } from './_session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const u = String(username).trim();
    const p = String(password);

    // Look up user
    const { rows } = await query(
      `SELECT id, password_hash, role FROM users WHERE username = $1 LIMIT 1`,
      [u]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const { id, password_hash, role } = rows[0];
    if (!verifyPassword(p, password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create a secure random token and insert session
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 12 * 3600 * 1000); // 12h
    await query(
      `INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [id, token, expires]
    );

    // Write cookie
    writeSessionCookie(res, token);

    return res.status(200).json({ ok: true, role });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}