import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');

if (missing.length > 0) {
  // Throw early so Render / local dev fails fast with a clear message.
  // Copy backend/.env.example -> backend/.env and fill values.
  throw new Error(`Missing required env vars: ${missing.join(', ')}. See backend/.env.example`);
}

const parseCsv = (v) =>
  String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  corsOrigins: parseCsv(process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000'),

  otp: {
    provider: process.env.OTP_PROVIDER || 'log',
    providerKey: process.env.OTP_PROVIDER_KEY || '',
    ttlMinutes: Number(process.env.OTP_TTL_MINUTES || 5),
    cooldownSeconds: Number(process.env.OTP_COOLDOWN_SECONDS || 60),
  },

  pepper: process.env.PIN_PEPPER || process.env.PEPPER || '',

  chat: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    maxTokens: Number(process.env.CHAT_MAX_TOKENS || 500),
  },

  seed: {
    doctorId: process.env.SEED_DOCTOR_ID || 'DOC-001',
    doctorPin: process.env.SEED_DOCTOR_PIN || '1234',
    staffId: process.env.SEED_STAFF_ID || 'STAFF-001',
    staffPin: process.env.SEED_STAFF_PIN || '1234',
  },
};

export default config;
