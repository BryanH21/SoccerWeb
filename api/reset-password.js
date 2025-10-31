// /api/reset-password.js
export const config = { runtime: 'nodejs' };

import { query } from './_db.js';
import { hashPassword } from './_crypto.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST')
      return res.status(405).json({ error: 'Method not allowed' });

    const { username, newPassword } = req.body || {};
    if (!username || !newPassword)
      return res.status(400).json({ error: 'Missing username or password' });

    const { rowCount } = await query(
      `UPDATE users SET password_hash = $1 WHERE username = $2`,
      [hashPassword(newPassword), username.trim()]
    );

    if (rowCount === 0)
      return res.status(404).json({ error: 'Username not found' });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('RESET ERROR:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}