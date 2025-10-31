// /api/session.js
export const config = { runtime: 'nodejs' };

import { parse } from 'cookie';
import { query } from './_db.js';
import { getSession, clearSessionCookie } from './_session.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'GET') {
      const me = await getSession(req);
      return res.status(200).json(me || {});
    }

    if (req.method === 'DELETE') {
      const cookies = parse(req.headers?.cookie || '');
      const token = cookies.sid;
      if (token) {
        await query(`DELETE FROM sessions WHERE token = $1`, [token]);
      }
      clearSessionCookie(res);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('SESSION API ERROR:', err);
    res
      .status(500)
      .json({ error: 'Internal server error', detail: String(err) });
  }
}