export const config = { runtime: 'nodejs' };
import { pool } from './_db';
import { readSessionCookie, clearSessionCookie } from './_session';

export default async function handler(req, res) {
  const token = readSessionCookie(req);
  if (token) {
    const client = await pool.connect();
    try {
      await client.sql`DELETE FROM sessions WHERE token=${token}`;
    } finally {
      client.release();
    }
  }
  clearSessionCookie(res);
  res.redirect('/login.html');
}