// /api/me.js
export const config = { runtime: 'nodejs' };

import { query } from './_db.js';
import { getSession } from './_session.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');

    const me = await getSession(req);
    if (!me) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Fetch player profile details
    const { rows } = await query(
      `SELECT plan, next_payment_date, renewal_date, session_count, goals, milestones
         FROM player_profiles
        WHERE user_id = $1
        LIMIT 1`,
      [me.user_id]
    );

    const profile = rows[0] || {
      plan: null,
      next_payment_date: null,
      renewal_date: null,
      session_count: 0,
      goals: [],
      milestones: [],
    };

    return res.status(200).json({
      user_id: me.user_id,
      username: me.username,
      role: me.role,
      profile,
    });
  } catch (e) {
    console.error('ME ERROR:', e);
    res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}