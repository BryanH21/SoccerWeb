// /api/admin/profiles.js
export const config = { runtime: 'nodejs' };

import { sql } from '../_db.js';
import { getSession } from '../_session.js';

function normalizeGoals(input) {
  if (!Array.isArray(input)) return [];
  return input.map(g => {
    if (typeof g === 'string') return { title: g, timeframe: '' };
    return { title: (g?.title || '').toString(), timeframe: (g?.timeframe || '').toString() };
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
        plan = null,
        next_payment_date = null,
        renewal_date = null,
        session_count = null,
        goals = null,
        milestones = null,
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

      // Build dynamic update based on provided fields
      const updates = [];
      const params = [];

      if (plan !== undefined) { updates.push(sql`plan = ${plan}`); }
      if (next_payment_date !== undefined) { updates.push(sql`next_payment_date = ${next_payment_date}`); }
      if (renewal_date !== undefined) { updates.push(sql`renewal_date = ${renewal_date}`); }
      if (session_count !== undefined && session_count !== null) {
        updates.push(sql`session_count = ${Number(session_count)}`);
      }
      if (goals !== undefined && goals !== null) {
        updates.push(sql`goals = ${JSON.stringify(normalizeGoals(goals))}::jsonb`);
      }
      if (milestones !== undefined && milestones !== null) {
        updates.push(sql`milestones = ${JSON.stringify(normalizeMilestones(milestones))}::jsonb`);
      }

      if (updates.length) {
        await sql/*sql*/`
          UPDATE player_profiles
          SET ${sql.join(updates, sql`, `)}
          WHERE user_id = ${userId};
        `;
      }

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