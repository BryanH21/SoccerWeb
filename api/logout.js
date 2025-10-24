export const config = { runtime: 'nodejs' };

import { pool } from './_db.js';
import { readSessionCookie, clearSessionCookie } from './_session.js';

export default async function handler(req, res) {
  try {
    const token = readSessionCookie(req);
    if (token) {
      await pool.sql`DELETE FROM sessions WHERE token = ${token}`;
    }
  } catch {}
  clearSessionCookie(res);
  res.redirect('/login.html');
}