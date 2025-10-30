export const config = { runtime: 'nodejs' };

import { pool } from './_db.js';
import { readSessionCookie } from './_session.js';

export default async function handler(req, res) {
  try {
    const token = readSessionCookie(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const result = await pool.sql`
      SELECT u.id, u.username, u.first_name, u.last_initial, u.role
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

    // Fetch player profile details
    const prof = await pool.sql`
      SELECT plan, next_payment_date, renewal_date, session_count, goals, milestones
      FROM player_profiles
      WHERE user_id = ${user.id}
      LIMIT 1
    `;

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      name: `${user.first_name} ${user.last_initial}.`,
      profile: prof.rows[0] ? {
        plan: prof.rows[0].plan,
        next_payment_date: prof.rows[0].next_payment_date,
        renewal_date: prof.rows[0].renewal_date,
        session_count: prof.rows[0].session_count ?? 0,
        goals: prof.rows[0].goals ?? [],
        milestones: prof.rows[0].milestones ?? []
      } : { plan: null, next_payment_date: null, renewal_date: null, session_count: 0, goals: [], milestones: [] }
    });
  } catch (e) {
    console.error('ME ERROR:', e);
    res.status(500).json({ error: 'Server error' });
  }
}