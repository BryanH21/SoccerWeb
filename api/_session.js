export const config = { runtime: 'nodejs' };

import crypto from 'crypto';
const COOKIE_NAME = 'fsa_session';
const secret = process.env.SESSION_SECRET;

export function setSessionCookie(res, token, maxAgeSeconds = 12 * 60 * 60) {
  const signed = signCookie(token);
  const cookie = `${COOKIE_NAME}=${signed}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}; Secure`;
  res.setHeader('Set-Cookie', cookie);
}
export function clearSessionCookie(res) {
  const cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
  res.setHeader('Set-Cookie', cookie);
}
export function readSessionCookie(req) {
  const raw = (req.headers.cookie || '')
    .split(';')
    .map(s => s.trim())
    .find(s => s.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return null;
  const signed = raw.split('=')[1];
  return verifyCookie(signed);
}
function signCookie(value) {
  const h = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  return `${value}.${h}`;
}
function verifyCookie(signed) {
  const [value, sig] = (signed || '').split('.');
  if (!value || !sig) return null;
  const h = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(h)) ? value : null;
}