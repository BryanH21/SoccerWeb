// /api/me.js
export const config = { runtime: 'nodejs' };

import { sql } from './_db.js';
import { getSession } from './_session.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');
    const me = await getSession(req);
    if (!me) return res.status(401).json({ error: 'Not authenticated' });

    // Fetch player profile details
    const profileRows = await sql/*sql*/`
      SELECT plan, next_payment_date, renewal_date, session_count, goals, milestones
      FROM player_profiles
      WHERE user_id = ${me.id}
      LIMIT 1;
    `;

    const profile = profileRows[0] || {
      plan: null,
      next_payment_date: null,
      renewal_date: null,
      session_count: 0,
      goals: [],
      milestones: []
    };

    return res.status(200).json({
      id: me.id,
      username: me.username,
      role: me.role,
      name: `${me.first_name} ${me.last_initial}.`,
      profile: {
        plan: profile.plan,
        next_payment_date: profile.next_payment_date,
        renewal_date: profile.renewal_date,
        session_count: profile.session_count ?? 0,
        goals: profile.goals ?? [],
        milestones: profile.milestones ?? []
      }
    });
  } catch (e) {
    console.error('ME ERROR:', e);
    res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}