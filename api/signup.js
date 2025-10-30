// /api/signup.js
export const config = { runtime: 'nodejs' };

import { sql } from './_db.js';
import { hashPassword } from './_crypto.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const { username, password, passwordConfirm, firstName, lastInitial } = req.body || {};
    if (!username || !password || !firstName || !lastInitial) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const u = String(username).trim();
    const p = String(password);
    const p2 = passwordConfirm ? String(passwordConfirm) : '';
    const f = String(firstName).trim();
    const l = String(lastInitial).trim().toUpperCase();

    // Validation
    if (u.length < 3 || u.length > 24) {
      return res.status(400).json({ error: 'Username must be between 3 and 24 characters.' });
    }
    if (!/^[A-Za-z0-9_]+$/.test(u)) {
      return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores.' });
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    if (!strongPassword.test(p)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and include one uppercase, one lowercase, one number, and one special character.'
      });
    }
    if (p !== p2) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (f.length < 1 || f.length > 30) {
      return res.status(400).json({ error: 'First name must be 1–30 characters.' });
    }
    if (!/^[A-Z]$/.test(l)) {
      return res.status(400).json({ error: 'Last initial must be exactly one letter (A–Z).' });
    }

    // Check for existing user
    const existing = await sql/*sql*/`SELECT 1 FROM users WHERE username=${u} LIMIT 1`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    // Create user and hash password
    const hash = hashPassword(p);
    const inserted = await sql/*sql*/`
      INSERT INTO users (username, password_hash, first_name, last_initial)
      VALUES (${u}, ${hash}, ${f}, ${l})
      RETURNING id;
    `;

    // Create player profile entry
    await sql/*sql*/`
      INSERT INTO player_profiles (user_id, plan, next_payment_date, renewal_date, session_count, goals, milestones)
      VALUES (${inserted[0].id}, NULL, NULL, NULL, 0, '[]'::jsonb, '[]'::jsonb)
      ON CONFLICT (user_id) DO NOTHING;
    `;

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('SIGNUP ERROR:', err);
    return res.status(500).json({ error: 'Internal server error', detail: String(err) });
  }
}