export const config = { runtime: 'nodejs' };

import { sql } from './_db.js';
import crypto from 'crypto';

const COOKIE_NAME = 'session';
const secret = process.env.SESSION_SECRET;

// --- Cookie helpers ---
function parseCookies(req) {
  const raw = req.headers?.cookie || '';
  const out = {};
  raw.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

// --- Session Cookie signing ---
function signCookie(value) {
  if (!secret) throw new Error('Missing SESSION_SECRET');
  const h = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  return `${value}.${h}`;
}
function verifyCookie(signed) {
  if (!signed || !secret) return null;
  const [value, sig] = signed.split('.');
  if (!value || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? value : null;
  } catch {
    return null;
  }
}

// --- Core functions ---
export async function setSessionCookie(res, token, maxAgeSeconds = 12 * 60 * 60) {
  const signed = signCookie(token);
  const cookie = `${COOKIE_NAME}=${signed}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}; Secure`;
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
  res.setHeader('Set-Cookie', cookie);
}

export async function getSession(req) {
  const cookies = parseCookies(req);
  const signed = cookies[COOKIE_NAME];
  const token = verifyCookie(signed);
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

export async function requireAuth(req, res) {
  const me = await getSession(req);
  if (!me) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return me;
}

export async function destroySession(req, res) {
  const cookies = parseCookies(req);
  const signed = cookies[COOKIE_NAME];
  const token = verifyCookie(signed);
  if (token) {
    await sql/*sql*/`DELETE FROM sessions WHERE token = ${token};`;
  }
  clearSessionCookie(res);
  return { ok: true };
}