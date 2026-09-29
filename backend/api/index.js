// backend/api/index.js — Vercel serverless entry (10s Hobby limit safe).
// No app.listen here. Vercel calls the exported handler per request.
// DB connection is cached via src/config/db.js (readyState check).
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let dbReady = null;

async function ensureDB() {
  if (!dbReady) {
    dbReady = connectDB().catch((err) => {
      dbReady = null;
      throw err;
    });
  }
  return dbReady;
}

export default async function handler(req, res) {
  try {
    // 10s limit: fail fast if DB hangs — Vercel will 504 after maxDuration.
    await Promise.race([
      ensureDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB connect timeout (9s)')), 9000)
      ),
    ]);
  } catch (err) {
    console.error('Vercel DB connect failed:', err?.message || err);
    res.status(503).json({ ok: false, error: 'Database unavailable, retry' });
    return;
  }
  return app(req, res);
}
