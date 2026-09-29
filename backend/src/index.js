// --- Boot (local / Render persistent server): connect DB, then listen ---
// Vercel serverless uses backend/api/index.js instead (no listen).
import app from './app.js';
import { config } from './config/env.js';
import connectDB from './config/db.js';

const port = config.port;

connectDB()
  .then(() => {
    app.listen(port, () => console.log(`blood-bank-api listening on :${port} [${config.env}]`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB, exiting:', err?.message || err);
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  if (config.isProd) process.exit(1);
});

export default app;
