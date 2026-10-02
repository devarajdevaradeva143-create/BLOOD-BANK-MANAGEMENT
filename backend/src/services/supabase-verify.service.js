// backend/src/services/supabase-verify.service.js
// Supabase-only OTP verification (donor flow, Option A: JWT stays).
// Frontend does signInWithOtp({ email }) + verifyOtp({ email, token, type:'email' })
// via publishable key, then sends the session access_token here.
// We verify server-side with SERVICE_ROLE (getUser) — never trust frontend alone.
//
// Env (Render dashboard / local .env — SERVICE_ROLE never goes to frontend):
//   SUPABASE_URL=https://xyz.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (service_role, Secret)
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

let adminClient = null;

export function isSupabaseConfigured() {
  return Boolean(
    String(config.supabase?.url || '').trim() &&
      String(config.supabase?.serviceRoleKey || '').trim()
  );
}

function supabaseAdmin() {
  if (adminClient) return adminClient;
  adminClient = createClient(
    String(config.supabase.url).trim(),
    String(config.supabase.serviceRoleKey).trim(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return adminClient;
}

function supabaseError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Verify a Supabase session access_token and return the confirmed email.
 * Throws 503 (not configured) / 401 (bad/expired token or email mismatch).
 * @param {string} accessToken Supabase session access_token from verifyOtp
 * @param {string} expectedEmail email the frontend claims (lowercase compare)
 * @returns {Promise<{ email: string, supabaseUserId: string }>}
 */
export async function verifySupabaseEmail(accessToken, expectedEmail) {
  const token = String(accessToken || '').trim();
  if (!token) throw supabaseError('Email verification is required', 401);
  if (!isSupabaseConfigured()) {
    throw supabaseError('Email verification is not configured', 503);
  }
  const expected = String(expectedEmail || '').trim().toLowerCase();
  if (!expected) throw supabaseError('Email is required', 400);

  let user;
  try {
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error || !data?.user) throw new Error(error?.message || 'no user');
    user = data.user;
  } catch {
    throw supabaseError('Invalid or expired verification', 401);
  }

  const confirmedEmail = String(user.email || '').trim().toLowerCase();
  // Supabase sets email_confirmed_at once the OTP is verified.
  if (!user.email_confirmed_at || !confirmedEmail) {
    throw supabaseError('Email is not verified', 401);
  }
  if (confirmedEmail !== expected) {
    throw supabaseError('Verified email does not match', 401);
  }
  return { email: confirmedEmail, supabaseUserId: String(user.id || '') };
}

export default { verifySupabaseEmail, isSupabaseConfigured };
