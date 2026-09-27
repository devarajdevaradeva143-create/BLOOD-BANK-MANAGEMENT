import { asyncHandler } from '../middleware/asyncHandler.js';
import Otp from '../models/Otp.js';
import { config } from '../config/env.js';
import { logAudit } from '../middleware/audit.js';
import {
  genOtp,
  hashValue,
  verifyHash,
  isOnCooldown,
  otpExpiryDate,
} from '../utils/otp.js';

function hospitalResetTarget(email) {
  return `hospital-email:${String(email || '').trim().toLowerCase()}`;
}

const GENERIC_HOSPITAL_FORGOT = 'If an account exists, an OTP has been sent';
const MAX_RESET_ATTEMPTS = 5;

/**
 * POST /api/hospitals/forgot-password
 * Body: { email } — generic response, hashed OTP, cooldown + TTL.
 * Real-time: code is logged server-side in non-production (OTP_PROVIDER=log).
 * NOTE: OTP is issued for any valid email (even local-only demo accounts)
 * so the Blood-request-frontend (localStorage auth) can verify server-side.
 * Response is always generic to avoid user enumeration.
 */
export const forgotHospitalPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }

  const target = hospitalResetTarget(email);
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

  logAudit(null, 'hospital.forgot_password', 'Hospital', email, req);
  return res.status(200).json({ message: GENERIC_HOSPITAL_FORGOT });
});

/**
 * POST /api/hospitals/reset-password
 * Body: { email, code, newPassword } — verifies OTP server-side.
 * Hospital accounts currently live in the frontend (localStorage), so there
 * is no backend password to update yet; the frontend syncs its local copy
 * after success. When a Hospital model lands, update its passwordHash here
 * (same pattern as donor.reset_password).
 */
export const resetHospitalPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  const newPassword = String(req.body?.newPassword || '');
  if (!email || !code || !newPassword) {
    return res
      .status(400)
      .json({ message: 'email, code and newPassword are required' });
  }

  const targetHash = hashValue(hospitalResetTarget(email));
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

  logAudit(null, 'hospital.reset_password', 'Hospital', email, req);
  return res
    .status(200)
    .json({ message: 'Password reset successful. Please login again.' });
});

export default {
  forgotHospitalPassword,
  resetHospitalPassword,
};
