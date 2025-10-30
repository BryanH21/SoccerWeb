// /api/admin/profiles.js
export const config = { runtime: 'nodejs' };

import { sql } from '../_db.js';
import { getSession } from '../_session.js';

// --- helpers ---
function normalizeGoals(input) {
  if (!Array.isArray(input)) return [];
  return input.map(g => {
    if (typeof g === 'string') return { title: g, timeframe: '' };
    return {
      title: (g?.title || '').toString(),
      timeframe: (g?.timeframe || '').toString()
    };
  });
}
function normalizeMilestones(input) {
  if (!Array.isArray(input)) return [];
  return input.map(m => ({
    title: (m?.title || '').toString(),
    timeframe: (m?.timeframe || '').toString(),
    done: !!m?.done
  }));
}

async function requireAdmin(req, res) {
  const me = await getSession(req, res);
  if (!me) { res.status(401).json({ error: 'Not authenticated' }); return null; }
  if (me.role !== 'admin') { res.status(403).json({ error: 'Admins only' }); return null; }
  return me;
}

export default async function handler(req, res) {
  try {
    const me = await requireAdmin(req, res);
    if (!me) return;

    if (req.method === 'GET') {
      const rows = await sql/*sql*/`
        SELECT
          u.id, u.username, u.first_name, u.last_initial, u.role,
          pp.plan, pp.next_payment_date, pp.renewal_date,
          COALESCE(pp.session_count, 0) AS session_count,
          COALESCE(pp.goals, '[]'::jsonb) AS goals,
          COALESCE(pp.milestones, '[]'::jsonb) AS milestones
        FROM users u
        LEFT JOIN player_profiles pp ON pp.user_id = u.id
        ORDER BY u.created_at DESC;
      `;
      res.status(200).json({ players: rows });
      return;
    }

    if (req.method === 'POST') {
      const {
        userId,
        plan = undefined,
        next_payment_date = undefined,
        renewal_date = undefined,
        session_count = undefined,
        goals = undefined,
        milestones = undefined,
        increment_session = false
      } = req.body || {};

      if (!userId) {
        res.status(400).json({ error: 'userId required' });
        return;
      }

      // Ensure profile row exists
      await sql/*sql*/`
        INSERT INTO player_profiles (user_id)
        VALUES (${userId})
        ON CONFLICT (user_id) DO NOTHING;
      `;

      if (increment_session) {
        await sql/*sql*/`
          UPDATE player_profiles
          SET session_count = COALESCE(session_count,0) + 1
          WHERE user_id = ${userId};
        `;
        res.status(200).json({ ok: true, incremented: true });
        return;
      }

      // Prepare values; if undefined, pass null so COALESCE keeps existing
      const plan_v = plan ?? null;
      const next_v = next_payment_date ?? null;
      const renew_v = renewal_date ?? null;
      const session_v = (session_count ?? null);
      const goals_v = (goals === undefined ? null : JSON.stringify(normalizeGoals(goals)));
      const milestones_v = (milestones === undefined ? null : JSON.stringify(normalizeMilestones(milestones)));

      await sql/*sql*/`
        UPDATE player_profiles SET
          plan = COALESCE(${plan_v}, plan),
          next_payment_date = COALESCE(${next_v}::date, next_payment_date),
          renewal_date = COALESCE(${renew_v}::date, renewal_date),
          session_count = COALESCE(${session_v}::int, session_count),
          goals = COALESCE(${goals_v}::jsonb, goals),
          milestones = COALESCE(${milestones_v}::jsonb, milestones)
        WHERE user_id = ${userId};
      `;

      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('ADMIN PROFILES ERROR:', err);
    res.status(500).json({ error: 'Internal error', detail: err?.message || String(err) });
  }
}