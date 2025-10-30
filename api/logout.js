export const config = { runtime: 'nodejs' };

import { destroySession } from './_session.js';

export default async function handler(req, res) {
  try {
    await destroySession(req, res);
    // Redirect to login after clearing session
    res.writeHead(302, { Location: '/login.html' });
    res.end();
  } catch (e) {
    console.error('LOGOUT ERROR:', e);
    res.status(500).json({ error: 'Logout failed' });
  }
}