// /api/admin/profiles.js
export const config = { runtime: 'nodejs' };

import { query } from '../_db.js';
import { getSession } from '../_session.js';

function normalizeGoals(input) {
  if (!Array.isArray(input)) return [];
  return input.map(g => {
    if (typeof g === 'string') return { title: g, timeframe: '' };
    return {
      title: (g?.title || '').toString(),
      timeframe: (g?.timeframe || '').toString(),
    };
  });
}

function normalizeMilestones(input) {
  if (!Array.isArray(input)) return [];
  return input.map(m => ({
    title: (m?.title || '').toString(),
    timeframe: (m?.timeframe || '').toString(),
    done: !!m?.done,
  }));
}

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');

    // --- Auth (admin only) ---
    const me = await getSession(req);
    if (!me) return res.status(401).json({ error: 'Not authenticated' });
    if (me.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    if (req.method === 'GET') {
      const { rows } = await query(`
        SELECT
          u.id, u.username, u.first_name, u.last_initial, u.role,
          p.plan, p.next_payment_date, p.renewal_date,
          COALESCE(p.session_count, 0) AS session_count,
          COALESCE(p.goals, '[]'::jsonb) AS goals,
          COALESCE(p.milestones, '[]'::jsonb) AS milestones
        FROM users u
        LEFT JOIN player_profiles p ON p.user_id = u.id
        ORDER BY u.created_at DESC;
      `);
      return res.status(200).json({ players: rows });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const {
        userId,
        plan = undefined,
        next_payment_date = undefined,
        renewal_date = undefined,
        session_count = undefined,
        goals = undefined,
        milestones = undefined,
        increment_session = false,
      } = body;

      if (!userId) return res.status(400).json({ error: 'userId required' });

      // Ensure the profile row exists
      await query(
        `INSERT INTO player_profiles (user_id) VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING;`,
        [userId]
      );

      if (increment_session) {
        await query(
          `UPDATE player_profiles
             SET session_count = COALESCE(session_count,0) + 1
           WHERE user_id = $1;`,
          [userId]
        );
        return res.status(200).json({ ok: true, incremented: true });
      }

      // Prepare values
      const plan_v = plan ?? null;
      const next_v = next_payment_date ?? null;
      const renew_v = renewal_date ?? null;
      const sess_v = session_count ?? null;
      const goals_v = goals === undefined ? null : JSON.stringify(normalizeGoals(goals));
      const ms_v = milestones === undefined ? null : JSON.stringify(normalizeMilestones(milestones));

      await query(
        `UPDATE player_profiles SET
            plan = COALESCE($2, plan),
            next_payment_date = COALESCE($3::date, next_payment_date),
            renewal_date = COALESCE($4::date, renewal_date),
            session_count = COALESCE($5::int, session_count),
            goals = COALESCE($6::jsonb, goals),
            milestones = COALESCE($7::jsonb, milestones)
          WHERE user_id = $1;`,
        [userId, plan_v, next_v, renew_v, sess_v, goals_v, ms_v]
      );

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('ADMIN PROFILES ERROR:', err);
    return res.status(500).json({ error: 'Internal error', detail: err?.message || String(err) });
  }
}