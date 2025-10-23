import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function newSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}