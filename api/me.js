export const config = { runtime: 'nodejs' };

import { pool } from './_db.js';
import { readSessionCookie } from './_session.js';

export default async function handler(req, res) {
  try {
    const token = readSessionCookie(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const result = await pool.sql`
      SELECT u.id, u.username, u.first_name, u.last_initial
      FROM users u
      JOIN sessions s ON s.user_id = u.id
      WHERE s.token = ${token} 
      AND s.expires_at > now()
      LIMIT 1
    `;

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Session expired' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      username: user.username,
      name: `${user.first_name} ${user.last_initial}.`
    });
  } catch (e) {
    console.error('ME ERROR:', e);
    res.status(500).json({ error: 'Server error' });
  }
}