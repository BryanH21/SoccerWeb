export const config = { runtime: 'nodejs' };

import { randomBytes, scryptSync } from 'node:crypto';
import { sql } from './_db.js';

// helper to hash passwords using scrypt (same as login)
function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64); // 64 bytes
  return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { username, password, passwordConfirm, firstName, lastInitial } = req.body || {};
    if (!username || !password || !firstName || !lastInitial) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const u = String(username).trim();
    const p = String(password);
    const p2 = passwordConfirm !== undefined ? String(passwordConfirm) : undefined;
    const f = String(firstName).trim();
    const l = String(lastInitial).trim().toUpperCase();

    // Validation
    if (u.length < 3 || u.length > 24) {
      return res.status(400).json({ error: 'Username must be 3–24 chars' });
    }
    if (!/^[A-Za-z0-9_]+$/.test(u)) {
      return res.status(400).json({ error: 'Username: letters, numbers, underscore only' });
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!strongPassword.test(p)) {
      return res.status(400).json({
        error:
          'Password must be at least 8 characters and include one uppercase, one lowercase, one number, and one special symbol.'
      });
    }
    if (p2 !== undefined && p !== p2) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (f.length < 1 || f.length > 30) {
      return res.status(400).json({ error: 'First name must be 1–30 chars' });
    }
    if (!/^[A-Z]$/.test(l)) {
      return res.status(400).json({ error: 'Last initial must be exactly one letter (A–Z)' });
    }

    // Uniqueness
    const existing = await sql/*sql*/`SELECT 1 FROM users WHERE username=${u} LIMIT 1`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username taken' });
    }

    // Create
    const hash = hashPassword(p);
    const inserted = await sql/*sql*/`
      INSERT INTO users (username, password_hash, first_name, last_initial)
      VALUES (${u}, ${hash}, ${f}, ${l})
      RETURNING id
    `;

    // Initialize empty profile
    await sql/*sql*/`
      INSERT INTO player_profiles (user_id, plan, next_payment_date, renewal_date, session_count, goals, milestones)
      VALUES (${inserted[0].id}, NULL, NULL, NULL, 0, '[]'::jsonb, '[]'::jsonb)
      ON CONFLICT (user_id) DO NOTHING
    `;

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error('SIGNUP ERROR:', e);
    return res.status(500).json({ error: 'Server error', detail: String(e) });
  }
}