// backend/src/services/clerk.service.js
// Clerk phone verification for Donor register (server-side only).
// Frontend verifies the mobile via Clerk SMS, then sends the Clerk session
// token; we verify the signature (JWKS) + confirm a verified phone number
// on the Clerk user, and match it to the registering mobile.
// Env (Render dashboard / local .env — SECRET never goes to frontend):
//   CLERK_SECRET_KEY=sk_... (required)
//   CLERK_JWT_KEY=<PEM public key> (optional, networkless verification)
import { createClerkClient, verifyToken } from '@clerk/backend';
import { config } from '../config/env.js';

export function isClerkConfigured() {
  return Boolean(String(config.clerk?.secretKey || '').trim());
}

function clerkClient() {
  return createClerkClient({ secretKey: String(config.clerk.secretKey).trim() });
}

/** E.164 (+91XXXXXXXXXX) or plain digits -> 10-digit Indian mobile, or null. */
export function toIndianMobile10(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const ten = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
}

function clerkError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Verify a Clerk session token and return the verified 10-digit mobile.
 * Throws 503 (Clerk not configured) / 401 (bad token) /
 * 502 (Clerk unreachable) / 400 (no verified phone).
 */
export async function verifyClerkPhone(clerkToken) {
  const token = String(clerkToken || '').trim();
  if (!token) throw clerkError('Phone verification is required', 400);
  if (!isClerkConfigured()) {
    throw clerkError('Phone verification is not configured', 503);
  }

  let payload;
  try {
    const opts = { secretKey: String(config.clerk.secretKey).trim() };
    const jwtKey = String(config.clerk?.jwtKey || '').trim();
    if (jwtKey) opts.jwtKey = jwtKey;
    payload = await verifyToken(token, opts);
  } catch {
    throw clerkError('Invalid or expired verification', 401);
  }

  const sub = String(payload?.sub || '').trim();
  if (!sub) throw clerkError('Invalid or expired verification', 401);

  let user;
  try {
    user = await clerkClient().users.getUser(sub);
  } catch {
    throw clerkError('Unable to verify phone number', 502);
  }

  const verified = (user?.phoneNumbers || []).find(
    (p) => p?.verification?.status === 'verified'
  );
  const phone10 = verified ? toIndianMobile10(verified.phoneNumber) : null;
  if (!phone10) throw clerkError('Phone number is not verified', 400);
  return { phone10, clerkUserId: sub };
}

export default { verifyClerkPhone, isClerkConfigured, toIndianMobile10 };
