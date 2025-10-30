// /api/_db.js
export const config = { runtime: 'nodejs' };

import { neon } from '@neondatabase/serverless';

// Connect to your Neon database
export const sql = neon(process.env.DATABASE_URL);