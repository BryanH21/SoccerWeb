// /api/_db.js
// Neon database client for serverless functions on Vercel

export const config = { runtime: 'nodejs' };

import { neon } from '@neondatabase/serverless';

// Establish a Neon serverless connection
// Make sure DATABASE_URL is set in your Vercel environment variables
export const sql = neon(process.env.DATABASE_URL);

// Example usage in any API route:
// import { sql } from '../_db.js';
// const rows = await sql`SELECT * FROM users;`