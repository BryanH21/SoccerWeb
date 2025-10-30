export const config = { runtime: 'nodejs' };

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Store as: scrypt:<hexSalt>:<hexHash>
export function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(plain), salt, 64); // 64 bytes
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(plain, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'hex');
  const actual = Buffer.from(parts[2], 'hex');
  const derived = scryptSync(String(plain), salt, actual.length);
  try { return timingSafeEqual(derived, actual); } catch { return false; }
}

export function newSessionToken() {
  // 32 bytes -> base64url token (cookie-safe)
  return randomBytes(32).toString('base64url');
}