import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config/env.js';
import connectDB from './config/db.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import otpRoutes from './routes/otp.routes.js';
import donorRoutes from './routes/donors.routes.js';
import hospitalRoutes from './routes/hospitals.routes.js';
import requestRoutes from './routes/requests.routes.js';
import donationRoutes from './routes/donations.routes.js';
import messageRoutes from './routes/messages.routes.js';
import unitsRoutes from './routes/units.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import statsRoutes from './routes/stats.routes.js';
import chatRoutes from './routes/chat.routes.js';
import notificationRoutes from './routes/notifications.routes.js';

const app = express();

// --- Security & parsing ---
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no Origin header) and whitelisted frontends.
      if (!origin) return cb(null, true);
      if (config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan(config.isProd ? 'combined' : 'dev'));
app.use(mongoSanitize());

// --- Global rate limit ---
app.use(globalLimiter);

// --- Health check (Render + uptime monitors) ---
app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, env: config.env, time: new Date().toISOString() });
});

// --- API routers ---
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// --- 404 + error handler (must be last) ---
app.use(notFound);
app.use(errorHandler);

// --- Boot: connect DB, then listen ---
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
});

export default app;
