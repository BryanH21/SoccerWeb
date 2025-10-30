// /api/session.js
export const config = { runtime: 'nodejs' };

import { sql } from './_db.js';

// Keep cookie name consistent with /api/login.js
const COOKIE_NAME = 'session';

// --- cookie parsing ---
function parseCookies(req) {
  const raw = req.headers?.cookie || '';
  const out = {};
  raw.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

// --- read current session (returns user or null) ---
export async function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const rows = await sql/*sql*/`
    SELECT u.id, u.username, u.first_name, u.last_initial, u.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1;
  `;
  return rows[0] || null;
}

// --- require auth (returns user or sends 401) ---
export async function requireAuth(req, res) {
  const me = await getSession(req);
  if (!me) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return me;
}

// --- destroy session + clear cookie (useful for /logout) ---
export async function destroySession(req, res) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (token) {
    await sql/*sql*/`DELETE FROM sessions WHERE token = ${token};`;
  }
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`
  ]);
  return { ok: true };
}