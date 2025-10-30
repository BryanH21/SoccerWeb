// /api/admin/profiles.js
import { pool } from '../_db.js';
import { readSessionCookie } from '../_session.js';

export const config = { runtime: 'edge' };

export default async function handler(req, res) {
  try {
    const token = readSessionCookie(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    // Who am I?
    const me = await pool.sql`
      SELECT u.id, u.role
      FROM users u
      JOIN sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > now()
      LIMIT 1
    `;
    if (me.rowCount === 0) return res.status(401).json({ error: 'Session expired' });
    if (me.rows[0].role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    if (req.method === 'GET') {
      const rows = await pool.sql`
        SELECT
          u.id, u.username, u.first_name, u.last_initial, u.role,
          p.plan, p.next_payment_date, p.renewal_date,
          COALESCE(p.session_count,0) AS session_count,
          COALESCE(p.goals, '[]'::jsonb) AS goals,
          COALESCE(p.milestones, '[]'::jsonb) AS milestones
        FROM users u
        LEFT JOIN player_profiles p ON p.user_id = u.id
        ORDER BY u.created_at DESC
      `;
      return res.json({ players: rows.rows });
    }

    if (req.method === 'POST') {
      const body = await readJson(req);
      const {
        userId,
        // plan + billing dates
        plan,
        next_payment_date,
        renewal_date,
        // roadmap
        goals,
        milestones,
        // sessions management
        session_count,
        increment_session
      } = body || {};

      if (!userId) return res.status(400).json({ error: 'userId required' });

      // Ensure a profile row exists
      await pool.sql`
        INSERT INTO player_profiles (user_id)
        VALUES (${userId})
        ON CONFLICT (user_id) DO NOTHING
      `;

      // Dynamic UPDATE builder
      const sets = [];
      const vals = [];
      let i = 1;

      if (plan !== undefined) { sets.push(`plan = $${i++}`); vals.push(plan || null); }
      if (next_payment_date !== undefined) { sets.push(`next_payment_date = $${i++}`); vals.push(next_payment_date || null); }
      if (renewal_date !== undefined) { sets.push(`renewal_date = $${i++}`); vals.push(renewal_date || null); }

      if (goals !== undefined) { sets.push(`goals = $${i++}::jsonb`); vals.push(JSON.stringify(goals ?? [])); }
      if (milestones !== undefined) { sets.push(`milestones = $${i++}::jsonb`); vals.push(JSON.stringify(milestones ?? [])); }

      if (increment_session) {
        sets.push(`session_count = COALESCE(session_count,0) + 1`);
      } else if (session_count !== undefined) {
        sets.push(`session_count = $${i++}`); vals.push(Math.max(0, Number(session_count) || 0));
      }

      if (sets.length === 0) return res.json({ ok: true, message: 'No changes provided' });

      vals.push(userId);
      const q = `
        UPDATE player_profiles
        SET ${sets.join(', ')}
        WHERE user_id = $${i}
        RETURNING plan, next_payment_date, renewal_date, session_count, goals, milestones
      `;

      const upd = await pool.query(q, vals);
      return res.json({ ok: true, profile: upd.rows[0] });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error('ADMIN PROFILES ERROR:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function readJson(req) {
  const text = await req.text();
  try { return JSON.parse(text || '{}'); } catch { return {}; }
}