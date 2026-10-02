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

  corsOrigins: parseCsv(
    process.env.CORS_ORIGINS ||
      'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:3000'
  ),

  otp: {
    provider: process.env.OTP_PROVIDER || 'log',
    providerKey: process.env.OTP_PROVIDER_KEY || '',
    ttlMinutes: Number(process.env.OTP_TTL_MINUTES || 5),
    cooldownSeconds: Number(process.env.OTP_COOLDOWN_SECONDS || 60),
  },

  email: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },

  // Clerk phone verification for Donor register (server-side only).
  // Publishable key stays in Donor-Frontend; SECRET never leaves backend.
  // DEPRECATED for donor flow — Supabase-only OTP now (see supabase below).
  clerk: {
    secretKey: process.env.CLERK_SECRET_KEY || '',
    jwtKey: process.env.CLERK_JWT_KEY || '',
  },

  // Supabase-only OTP (donor flow, Option A: JWT stays, OTP via Supabase).
  // Frontend uses publishable key; SERVICE_ROLE never leaves backend.
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  pepper: process.env.PIN_PEPPER || process.env.PEPPER || '',

  chat: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    maxTokens: Number(process.env.CHAT_MAX_TOKENS || 500),
  },

  seed: {
    districtAdminId: process.env.SEED_DISTRICT_ADMIN_ID || 'DIST-001',
    districtAdminPin: process.env.SEED_DISTRICT_ADMIN_PIN || '1234',
    superAdminId: process.env.SEED_SUPER_ADMIN_ID || 'SUPER001',
    superAdminPin: process.env.SEED_SUPER_ADMIN_PIN || 'Admin@123',
  },
};

export default config;
