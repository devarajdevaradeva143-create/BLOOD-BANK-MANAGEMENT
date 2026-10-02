import { asyncHandler } from '../middleware/asyncHandler.js';
import Otp from '../models/Otp.js';
import { config } from '../config/env.js';
import {
  genOtp,
  hashValue,
  verifyHash,
  isOnCooldown,
  otpExpiryDate,
} from '../utils/otp.js';
import { sendSms } from '../services/sms.service.js';

const MAX_ATTEMPTS = 5;

function otpError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Internal helper shared by donor/request controllers (no req/res).
 * Finds the latest unexpired, unconsumed OTP for (mobile, purpose),
 * enforces attempts < 5, compares the code hash, marks consumed.
 *
 * @param {string} mobile  plain identifier (mobile / email / staffId-derived target)
 * @param {string} code    plain 6-digit code
 * @param {'donor'|'request'|'reset'|'donation'} purpose
 * @returns {Promise<import('mongoose').Document>} the consumed Otp doc
  */
export async function verifyOtpInternal(mobile, code, purpose) {
  const target = String(mobile || '').trim();
  const plainCode = String(code || '').trim();
  if (!target || !plainCode) {
    throw otpError('Identifier and OTP code are required', 400);
  }
  if (!['donor', 'request', 'reset', 'donation'].includes(purpose)) {
    throw otpError('Invalid OTP purpose', 400);
  }

  const targetHash = hashValue(target);
  const doc = await Otp.findOne({
    targetHash,
    purpose,
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!doc) {
    throw otpError('Invalid or expired OTP', 400);
  }
  if ((doc.attempts || 0) >= MAX_ATTEMPTS) {
    throw otpError('Too many OTP attempts, request a new code', 429);
  }
  if (!verifyHash(plainCode, doc.codeHash)) {
    await Otp.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } });
    throw otpError('Invalid or expired OTP', 400);
  }

  doc.consumed = true;
  await doc.save();
  return doc;
}

/**
 * POST /api/otp/request  (public, rate-limited at route level)
 * Body: { mobile, purpose } — already validated by otpRequestSchema.
 */
export const requestOtp = asyncHandler(async (req, res) => {
  const { mobile, purpose } = req.body;
  const target = String(mobile || '').trim();
  const targetHash = hashValue(target);

  const latest = await Otp.findOne({ targetHash, purpose }).sort({
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
    purpose,
    targetHash,
    codeHash: hashValue(code),
    attempts: 0,
    consumed: false,
    expiresAt: otpExpiryDate(config.otp.ttlMinutes),
  });

  if (config.env !== 'production') {
    console.log(`[OTP:${purpose}] ${target} -> ${code}`);
  }

  // SMS is log-only (free). OTP is already saved above,
  // so a send failure must not lose it — report 502 strictly.
  try {
    await sendSms(target, `Life Saver Blood Bank OTP: ${code}. Valid ${config.otp.ttlMinutes} mins.`);
  } catch (err) {
    console.error('SMS send failed:', err?.message || err);
    return res.status(502).json({ message: 'OTP send failed, please retry' });
  }

  return res.status(201).json({
    message: 'OTP sent',
    expiresIn: Number(config.otp.ttlMinutes) * 60 || 300,
  });
});

/**
 * POST /api/otp/verify  (public, rate-limited at route level)
 * Body: { mobile, code, purpose } — already validated by otpVerifySchema.
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, code, purpose } = req.body;
  await verifyOtpInternal(mobile, code, purpose);
  return res.status(200).json({ verified: true, message: 'OTP verified' });
});

export default { requestOtp, verifyOtp, verifyOtpInternal };
