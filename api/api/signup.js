import { pool } from './_db';
import { hashPassword } from './_crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { username, password, passwordConfirm, firstName, lastInitial } = req.body || {};
  if (!username || !password || !firstName || !lastInitial)
    return res.status(400).json({ error: 'Missing fields' });
  if (passwordConfirm !== undefined && password !== passwordConfirm) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  const client = await pool.connect();
  try {
    const existing = await client.sql`SELECT 1 FROM users WHERE username=${username} LIMIT 1`;
    if (existing.rowCount) return res.status(409).json({ error: 'Username taken' });

    const hash = await hashPassword(password);
    await client.sql`
      INSERT INTO users (username, password_hash, first_name, last_initial)
      VALUES (${username}, ${hash}, ${firstName}, ${lastInitial})
    `;
    res.status(201).json({ ok: true });
  } finally {
    client.release();
  }
}