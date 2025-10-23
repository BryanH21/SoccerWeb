import { pool } from './_db';
import { readSessionCookie } from './_session';

export default async function handler(req, res) {
  const token = readSessionCookie(req);
  if (!token) return res.status(401).json({ error: 'Not signed in' });

  const client = await pool.connect();
  try {
    const s = await client.sql`SELECT user_id FROM sessions WHERE token=${token} AND expires_at > now() LIMIT 1`;
    if (s.rowCount === 0) return res.status(401).json({ error: 'Session expired' });

    const id = s.rows[0].user_id;
    const u = await client.sql`SELECT username, first_name, last_initial FROM users WHERE id=${id}`;
    const p = await client.sql`SELECT plan, last_assessment_date, session_count, goals, milestones FROM player_profiles WHERE user_id=${id}`;
    res.json({ user: u.rows[0], profile: p.rows[0] || null });
  } finally {
    client.release();
  }
}