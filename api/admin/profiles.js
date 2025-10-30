// /api/admin/profiles.js
export const config = { runtime: 'nodejs' };

import { sql } from '../_db.js';

// === Config ===
// If your cookie is named something else in _session.js, change this:
const SESSION_COOKIE_NAME = 'session';

// === Helpers ===
function parseCookies(req) {
  const raw = req.headers?.cookie || '';
  const out = {};
  raw.split(';').forEach(p => {
    const idx = p.indexOf('=');
    if (idx > -1) out[p.slice(0, idx).trim()] = decodeURIComponent(p.slice(idx + 1).trim());
  });
  return out;
}

async function getUserFromSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME] || cookies['session_token'] || cookies['token'];
  if (!token) return null;

  // Look up session and join to user; ensure not expired
  const rows = await sql/*sql*/`
    SELECT u.id, u.username, u.first_name, u.last_initial, u.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1;
  `;
  return rows[0] || null;
}

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
    // --- Auth (admin only) ---
    const me = await getUserFromSession(req);
    if (!me) return res.status(401).json({ error: 'Not authenticated' });
    if (me.role !== 'admin') return res.status(403).json({ error: 'Admins only' });

    if (req.method === 'GET') {
      // Return all users with joined player profile fields
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
        return res.status(200).json({ ok: true, incremented: true });
      }

      // Prepare values: use COALESCE to keep existing when value is null/undefined
      const plan_v = plan ?? null;
      const next_v = next_payment_date ?? null;
      const renew_v = renewal_date ?? null;
      const sess_v = session_count ?? null;

      const goals_v =
        goals === undefined ? null : JSON.stringify(normalizeGoals(goals));
      const ms_v =
        milestones === undefined ? null : JSON.stringify(normalizeMilestones(milestones));

      await sql/*sql*/`
        UPDATE player_profiles SET
          plan = COALESCE(${plan_v}, plan),
          next_payment_date = COALESCE(${next_v}::date, next_payment_date),
          renewal_date = COALESCE(${renew_v}::date, renewal_date),
          session_count = COALESCE(${sess_v}::int, session_count),
          goals = COALESCE(${goals_v}::jsonb, goals),
          milestones = COALESCE(${ms_v}::jsonb, milestones)
        WHERE user_id = ${userId};
      `;

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('ADMIN PROFILES ERROR:', err);
    return res.status(500).json({ error: 'Internal error', detail: err?.message || String(err) });
  }
}