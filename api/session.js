// /api/session.js
export const config = { runtime: 'nodejs' };

import { getSession, destroySession } from './_session.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const me = await getSession(req);
      return res.status(200).json(me || {});
    }

    if (req.method === 'DELETE') {
      await destroySession(req, res);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('SESSION API ERROR:', err);
    res.status(500).json({ error: 'Internal server error', detail: String(err) });
  }
}