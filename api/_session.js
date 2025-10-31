// /api/_session.js
import { query } from './_db.js';
import { parse } from 'cookie';

const COOKIE_NAME = 'sid';

export async function getSession(req) {
  try {
    const cookies = parse(req.headers?.cookie || '');
    const token = cookies[COOKIE_NAME];
    if (!token) return null;

    const { rows } = await query(
      `SELECT s.user_id, s.expires_at, u.username, u.role
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token = $1`,
      [token]
    );
    if (!rows.length) return null;

    const s = rows[0];
    if (new Date(s.expires_at) <= new Date()) return null;

    return { user_id: s.user_id, username: s.username, role: s.role };
  } catch {
    return null;
  }
}

export function writeSessionCookie(
  res,
  token,
  { maxAgeSeconds = 60 * 60 * 12 } = {}
) {
  const cookie = [
    `sid=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    'sid=deleted; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure'
  );
}