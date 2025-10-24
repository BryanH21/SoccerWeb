export const config = { runtime: 'nodejs' };
import { pool } from './_db';
import { hashPassword } from './_crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { username, password, passwordConfirm, firstName, lastInitial } = req.body || {};
  if (!username || !password || !firstName || !lastInitial)
    return res.status(400).json({ error: 'Missing fields' });
  if (passwordConfirm !== undefined && password !== passwordConfirm)
    return res.status(400).json({ error: 'Passwords do not match' });

  const strongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!strongPassword.test(password))
    return res.status(400).json({
      error:
        'Password must be at least 8 characters and include one uppercase, one lowercase, one number, and one special symbol.'
    });

  const client = await pool.connect();
  try {
    const existing = await client.sql`SELECT 1 FROM users WHERE username=${username} LIMIT 1`;
    if (existing.rowCount)
      return res.status(409).json({ error: 'Username taken' });

    const hash = await hashPassword(password);
    const inserted = await client.sql`
      INSERT INTO users (username, password_hash, first_name, last_initial)
      VALUES (${username}, ${hash}, ${firstName}, ${lastInitial})
      RETURNING id
    `;
    await client.sql`INSERT INTO player_profiles (user_id) VALUES (${inserted.rows[0].id}) ON CONFLICT DO NOTHING`;

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}