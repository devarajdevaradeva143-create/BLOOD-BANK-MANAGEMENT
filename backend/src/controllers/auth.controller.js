import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/asyncHandler.js';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { comparePin, hashPin } from '../utils/passwords.js';
import {
  signAccess,
  signRefresh,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/jwt.js';
import {
  hashValue,
  genOtp,
  verifyHash,
  isOnCooldown,
  otpExpiryDate,
} from '../utils/otp.js';
import { config } from '../config/env.js';
import { logAudit } from '../middleware/audit.js';

// Namespaced OTP target so staff reset codes never collide with
// donor/request mobile OTPs that share the Otp collection.
function staffResetTarget(staffId) {
  return `staff:${String(staffId || '').trim().toUpperCase()}`;
}

const GENERIC_FORGOT_MESSAGE = 'If an account exists, an OTP has been sent';
const MAX_RESET_ATTEMPTS = 5;

const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

function toSafeUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    staffId: user.staffId,
    name: user.name,
    role: user.role,
    designation: user.designation || null,
    districtId: user.districtId || '',
    active: user.active,
  };
}

function pruneExpiredTokens(user) {
  const now = new Date();
  user.refreshTokens = (user.refreshTokens || []).filter(
    (t) => t && t.expiresAt && new Date(t.expiresAt) > now
  );
}

/**
 * POST /api/auth/login
 * Body: { staffId, pin }
 */
export const login = asyncHandler(async (req, res) => {
  const { staffId, pin } = req.body;
  const normalizedId = String(staffId || '').trim().toUpperCase();

  const user = await User.findOne({ staffId: normalizedId });
  if (!user || user.active === false) {
    return res.status(401).json({ message: 'Invalid staff ID or PIN' });
  }

  const ok = await comparePin(pin, user.pinHash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid staff ID or PIN' });
  }

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  const tokenHash = hashValue(refreshToken);

  pruneExpiredTokens(user);
  user.refreshTokens.push({
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
  });
  await user.save();

  setRefreshCookie(res, refreshToken);
  logAudit(String(user._id), 'auth.login', 'User', String(user._id), req);

  return res.status(200).json({ user: toSafeUser(user), accessToken });
});

/**
 * POST /api/auth/refresh
 * Reads refreshToken cookie, rotates it, returns new access token.
 */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: 'Missing refresh token' });
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  const tokenHash = hashValue(token);
  const user = await User.findOne({
    _id: payload.id,
    'refreshTokens.tokenHash': tokenHash,
  });
  if (!user || user.active === false) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  // Rotate: drop the used token, prune expired, push replacement.
  user.refreshTokens = (user.refreshTokens || []).filter(
    (t) => t.tokenHash !== tokenHash && new Date(t.expiresAt) > new Date()
  );

  const accessToken = signAccess(user);
  const nextRefresh = signRefresh(user);
  user.refreshTokens.push({
    tokenHash: hashValue(nextRefresh),
    expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
  });
  await user.save();

  setRefreshCookie(res, nextRefresh);
  return res.status(200).json({ user: toSafeUser(user), accessToken });
});

/**
 * POST /api/auth/logout
 * Clears cookie + pulls the presented refresh token.
 */
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret);
      await User.updateOne(
        { _id: payload.id },
        { $pull: { refreshTokens: { tokenHash: hashValue(token) } } }
      );
    } catch {
      // Token already invalid/expired — still clear the cookie below.
      // Best-effort pull by hash even without a valid payload.
      try {
        await User.updateMany(
          { 'refreshTokens.tokenHash': hashValue(token) },
          { $pull: { refreshTokens: { tokenHash: hashValue(token) } } }
        );
      } catch {
        // ignore
      }
    }
  }

  clearRefreshCookie(res);
  return res.status(200).json({ message: 'Logged out' });
});

/**
 * GET /api/auth/me
 */
export const me = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    return res.status(200).json({ user: req.user || null });
  }
  const user = await User.findById(req.user.id).select('-pinHash -refreshTokens');
  if (!user) {
    return res.status(200).json({ user: req.user });
  }
  return res.status(200).json({ user: toSafeUser(user) });
});

/**
 * POST /api/auth/forgot-password
 * Body: { staffId }
 * Secure: generic response (no user enumeration), hashed OTP, 60s cooldown,
 * 5-min TTL, 5 attempts. Code is logged in non-production only (OTP_PROVIDER=log).
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const normalizedId = String(req.body?.staffId || '').trim().toUpperCase();
  if (!normalizedId) {
    return res.status(400).json({ message: 'staffId is required' });
  }

  const user = await User.findOne({ staffId: normalizedId });
  // Generic response even when the account does not exist.
  if (!user || user.active === false) {
    return res.status(200).json({ message: GENERIC_FORGOT_MESSAGE });
  }

  const target = staffResetTarget(normalizedId);
  const targetHash = hashValue(target);
  const latest = await Otp.findOne({ targetHash, purpose: 'reset' }).sort({
    createdAt: -1,
  });
  if (
    latest &&
    !latest.consumed &&
    isOnCooldown(latest.createdAt, config.otp.cooldownSeconds)
  ) {
    return res.status(429).json({
      message: `Please wait ${config.otp.cooldownSeconds}s before requesting another OTP`,
    });
  }

  const code = genOtp();
  await Otp.create({
    purpose: 'reset',
    targetHash,
    codeHash: hashValue(code),
    attempts: 0,
    consumed: false,
    expiresAt: otpExpiryDate(config.otp.ttlMinutes),
  });

  if (config.env !== 'production') {
    console.log(`[OTP:reset] ${target} -> ${code}`);
  }

  logAudit(String(user._id), 'auth.forgot_password', 'User', String(user._id), req);
  return res.status(200).json({ message: GENERIC_FORGOT_MESSAGE });
});

/**
 * POST /api/auth/reset-password
 * Body: { staffId, code, newPin }
 * Verifies the reset OTP, sets a new PIN hash, revokes all refresh sessions.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const normalizedId = String(req.body?.staffId || '').trim().toUpperCase();
  const code = String(req.body?.code || '').trim();
  const newPin = String(req.body?.newPin || '');
  if (!normalizedId || !code || !newPin) {
    return res.status(400).json({ message: 'staffId, code and newPin are required' });
  }

  const user = await User.findOne({ staffId: normalizedId });
  if (!user || user.active === false) {
    // Generic to avoid confirming which IDs exist.
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  const targetHash = hashValue(staffResetTarget(normalizedId));
  const doc = await Otp.findOne({
    targetHash,
    purpose: 'reset',
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!doc) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  if ((doc.attempts || 0) >= MAX_RESET_ATTEMPTS) {
    return res
      .status(429)
      .json({ message: 'Too many OTP attempts, request a new code' });
  }
  if (!verifyHash(code, doc.codeHash)) {
    doc.attempts = (doc.attempts || 0) + 1;
    await doc.save();
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  doc.consumed = true;
  await doc.save();

  user.pinHash = await hashPin(newPin);
  // Revoke all sessions — a password change must log out other devices.
  user.refreshTokens = [];
  await user.save();

  logAudit(String(user._id), 'auth.reset_password', 'User', String(user._id), req);
  return res.status(200).json({ message: 'PIN reset successful. Please login again.' });
});

export default { login, refresh, logout, me, forgotPassword, resetPassword };
