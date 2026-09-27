import { asyncHandler } from '../middleware/asyncHandler.js';
import Donor from '../models/Donor.js';
import Otp from '../models/Otp.js';
import { genDonorId } from '../utils/ids.js';
import { logAudit } from '../middleware/audit.js';
import { verifyOtpInternal } from './otp.controller.js';
import { hashPassword } from '../utils/passwords.js';
import { config } from '../config/env.js';
import {
  genOtp,
  hashValue,
  verifyHash,
  isOnCooldown,
  otpExpiryDate,
} from '../utils/otp.js';

function donorResetTarget(email) {
  return `donor-email:${String(email || '').trim().toLowerCase()}`;
}

const GENERIC_DONOR_FORGOT = 'If an account exists, an OTP has been sent';
const MAX_RESET_ATTEMPTS = 5;

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * POST /api/donors  (public — OTP gate replaces auth)
 * Body: donor fields + { code } (mobile OTP, purpose 'donor').
 */
export const createDonor = asyncHandler(async (req, res) => {
  const { mobile, code, otp, otpCode, ...donorData } = req.body;
  const plainCode = code ?? otp ?? otpCode;

  if (!mobile) {
    return res.status(400).json({ message: 'mobile is required' });
  }
  if (!plainCode) {
    return res.status(400).json({ message: 'OTP code is required' });
  }

  await verifyOtpInternal(String(mobile).trim(), String(plainCode).trim(), 'donor');

  const donor = await Donor.create({
    ...donorData,
    mobile: String(mobile).trim(),
    donorId: genDonorId(),
    mobileVerified: true,
  });

  logAudit(null, 'donor.create', 'Donor', donor.donorId, req, {
    mobile: donor.mobile,
  });

  return res.status(201).json({ message: 'Donor registered', donor });
});

/**
 * GET /api/donors  (auth required at route level)
 * Query: ?bloodGroup=&district=&search=&page=&limit=
 */
export const listDonors = asyncHandler(async (req, res) => {
  const { bloodGroup, district, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (district) filter.district = new RegExp(`^${String(district).trim()}$`, 'i');
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { fullName: new RegExp(q, 'i') },
      { donorId: new RegExp(q, 'i') },
      { mobile: new RegExp(q, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    Donor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Donor.countDocuments(filter),
  ]);

  return res.status(200).json({
    data,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

/**
 * POST /api/donors/forgot-password
 * Body: { email } — generic response, hashed OTP, cooldown + TTL.
 * Real-time: code is logged server-side in non-production (OTP_PROVIDER=log).
 * NOTE: OTP is issued for any valid email (even local-only demo accounts)
 * so the Donor-Frontend (localStorage auth) can verify server-side.
 * Response is always generic to avoid user enumeration.
 */
export const forgotDonorPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }

  const target = donorResetTarget(email);
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

  const donor = await Donor.findOne({ email });
  logAudit(
    null,
    'donor.forgot_password',
    'Donor',
    donor ? donor.donorId : email,
    req
  );
  return res.status(200).json({ message: GENERIC_DONOR_FORGOT });
});

/**
 * POST /api/donors/reset-password
 * Body: { email, code, newPassword } — verifies OTP server-side, then
 * stores bcrypt hash when a backend Donor exists. Local-only demo accounts
 * (Donor-Frontend localStorage) still get server-side OTP verification;
 * the frontend syncs its local copy after success.
 */
export const resetDonorPassword = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  const newPassword = String(req.body?.newPassword || '');
  if (!email || !code || !newPassword) {
    return res
      .status(400)
      .json({ message: 'email, code and newPassword are required' });
  }

  const targetHash = hashValue(donorResetTarget(email));
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

  const donor = await Donor.findOne({ email });
  if (donor) {
    donor.passwordHash = await hashPassword(newPassword);
    await donor.save();
    logAudit(null, 'donor.reset_password', 'Donor', donor.donorId, req);
  } else {
    logAudit(null, 'donor.reset_password', 'Donor', email, req);
  }
  return res
    .status(200)
    .json({ message: 'Password reset successful. Please login again.' });
});

export default {
  createDonor,
  listDonors,
  forgotDonorPassword,
  resetDonorPassword,
};
