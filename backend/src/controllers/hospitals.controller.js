import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/asyncHandler.js';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { config } from '../config/env.js';
import { logAudit } from '../middleware/audit.js';
import { comparePassword, hashPassword } from '../utils/passwords.js';
import {
  signAccess,
  signRefresh,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/jwt.js';
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
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

function toSafeHospital(h) {
  if (!h) return null;
  return {
    id: String(h._id),
    hospitalName: h.hospitalName,
    registrationNumber: h.registrationNumber,
    hospitalId: h.hospitalId || '',
    hospitalType: h.hospitalType || '',
    email: h.email,
    phone: h.phone || '',
    emergencyContact: h.emergencyContact || '',
    district: h.district || '',
    districtId: h.districtId || '',
    address: h.address,
    pincode: h.pincode || '',
    website: h.website || '',
    officerName: h.officerName || '',
    officerDesignation: h.officerDesignation || '',
    officerContact: h.officerContact || '',
    role: 'Hospital',
    active: h.active,
  };
}

function pruneExpiredTokens(hospital) {
  const now = new Date();
  hospital.refreshTokens = (hospital.refreshTokens || []).filter(
    (t) => t && t.expiresAt && new Date(t.expiresAt) > now
  );
}

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * GET /api/hospitals (DistrictAdmin/SuperAdmin at route level)
 * Query: ?districtId=&search=&hospitalType=&page=&limit=
 * District scope: DistrictAdmin forced to own district (fail-closed 403
 * if no district); SuperAdmin may filter by ?districtId.
 */
export const listHospitals = asyncHandler(async (req, res) => {
  const { districtId, search, hospitalType } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  // Resolve admin district from JWT with DB fallback (do not trust JWT alone).
  let adminDistrict = String(req.user?.districtId || '').trim().toLowerCase();
  if (!adminDistrict && req.user?.id && req.user?.role !== 'Hospital') {
    try {
      const me = await User.findById(req.user.id).select('districtId').lean();
      adminDistrict = String(me?.districtId || '').trim().toLowerCase();
    } catch {
      adminDistrict = '';
    }
  }

  // Fail-closed: DistrictAdmin without a district must not see every district.
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  const filter = {};
  if (req.user?.role === 'DistrictAdmin') {
    filter.districtId = adminDistrict;
  } else if (districtId) {
    filter.districtId = String(districtId).trim().toLowerCase();
  }
  if (hospitalType) {
    filter.hospitalType = String(hospitalType).trim();
  }
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { hospitalName: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { registrationNumber: new RegExp(q, 'i') },
      { hospitalId: new RegExp(q, 'i') },
    ];
  }

  const [docs, total] = await Promise.all([
    Hospital.find(filter)
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Hospital.countDocuments(filter),
  ]);

  return res.status(200).json({
    data: docs.map(toSafeHospital),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

async function issueSession(hospital, res, req, auditAction) {
  const accessToken = signAccess({ _id: hospital._id, role: 'Hospital', districtId: hospital.districtId });
  const refreshToken = signRefresh({ _id: hospital._id, role: 'Hospital', districtId: hospital.districtId });

  pruneExpiredTokens(hospital);
  hospital.refreshTokens.push({
    tokenHash: hashValue(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
  });
  await hospital.save();

  setRefreshCookie(res, refreshToken);
  logAudit(String(hospital._id), auditAction, 'Hospital', String(hospital._id), req);
  return { user: toSafeHospital(hospital), accessToken };
}

/**
 * POST /api/hospitals/register
 * Body: hospital fields + { password } (validated by hospitalRegisterSchema).
 * Auto-logs the hospital in (same as donor-style onboarding).
 */
export const registerHospital = asyncHandler(async (req, res) => {
  const { password, email, registrationNumber, ...rest } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const existing = await Hospital.findOne({
    $or: [{ email: normalizedEmail }, { registrationNumber: String(registrationNumber || '').trim() }],
  });
  if (existing) {
    return res.status(409).json({ message: 'A hospital with this email or registration number already exists' });
  }

  const hospital = await Hospital.create({
    ...rest,
    email: normalizedEmail,
    registrationNumber: String(registrationNumber || '').trim(),
    districtId: String(rest.districtId || '').trim().toLowerCase(),
    passwordHash: await hashPassword(password),
  });

  const session = await issueSession(hospital, res, req, 'hospital.register');
  return res.status(201).json({ message: 'Hospital registered', ...session });
});

/**
 * POST /api/hospitals/login
 * Body: { email, password }
 */
export const loginHospital = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const hospital = await Hospital.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!hospital || hospital.active === false) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const ok = await comparePassword(password, hospital.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const session = await issueSession(hospital, res, req, 'hospital.login');
  return res.status(200).json(session);
});

/**
 * POST /api/hospitals/refresh — rotates refresh cookie, returns access token.
 */
export const refreshHospital = asyncHandler(async (req, res) => {
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
  if (payload.role !== 'Hospital') {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const tokenHash = hashValue(token);
  const hospital = await Hospital.findOne({
    _id: payload.id,
    'refreshTokens.tokenHash': tokenHash,
  });
  if (!hospital || hospital.active === false) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  hospital.refreshTokens = (hospital.refreshTokens || []).filter(
    (t) => t.tokenHash !== tokenHash && new Date(t.expiresAt) > new Date()
  );

  const session = await issueSession(hospital, res, req, 'hospital.refresh');
  return res.status(200).json(session);
});

/**
 * POST /api/hospitals/logout — clears cookie + pulls presented token.
 */
export const logoutHospital = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret);
      await Hospital.updateOne(
        { _id: payload.id },
        { $pull: { refreshTokens: { tokenHash: hashValue(token) } } }
      );
    } catch {
      try {
        await Hospital.updateMany(
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
 * GET /api/hospitals/me — current hospital profile (auth required).
 */
export const meHospital = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    return res.status(200).json({ user: req.user || null });
  }
  if (req.user?.role !== 'Hospital') {
    return res.status(403).json({ message: 'Hospital account required' });
  }
  const hospital = await Hospital.findById(req.user.id).select('-passwordHash -refreshTokens');
  if (!hospital) {
    return res.status(404).json({ message: 'Hospital not found' });
  }
  return res.status(200).json({ user: toSafeHospital(hospital) });
});

/**
 * PATCH /api/hospitals/me — update own profile (auth required).
 * Body: validated by hospitalUpdateSchema (identity fields immutable).
 */
export const updateHospitalProfile = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'Hospital') {
    return res.status(403).json({ message: 'Hospital account required' });
  }
  const patch = { ...req.body };
  if (patch.districtId !== undefined) {
    patch.districtId = String(patch.districtId || '').trim().toLowerCase();
  }
  const hospital = await Hospital.findByIdAndUpdate(req.user.id, patch, {
    new: true,
    runValidators: true,
  }).select('-passwordHash -refreshTokens');
  if (!hospital) {
    return res.status(404).json({ message: 'Hospital not found' });
  }
  logAudit(String(hospital._id), 'hospital.profile_update', 'Hospital', String(hospital._id), req);
  return res.status(200).json({ message: 'Profile updated', user: toSafeHospital(hospital) });
});

/**
 * POST /api/hospitals/forgot-password
 * Body: { email } — generic response, hashed OTP, cooldown + TTL.
 * Real-time: code is logged server-side in non-production (OTP_PROVIDER=log).
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

  const hospital = await Hospital.findOne({ email });
  logAudit(
    hospital ? String(hospital._id) : null,
    'hospital.forgot_password',
    'Hospital',
    hospital ? String(hospital._id) : email,
    req
  );
  return res.status(200).json({ message: GENERIC_HOSPITAL_FORGOT });
});

/**
 * POST /api/hospitals/reset-password
 * Body: { email, code, newPassword } — verifies OTP, sets a new password
 * hash and revokes all refresh sessions.
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

  const hospital = await Hospital.findOne({ email });
  if (!hospital) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  hospital.passwordHash = await hashPassword(newPassword);
  // Revoke all sessions — a password change must log out other devices.
  hospital.refreshTokens = [];
  await hospital.save();

  logAudit(String(hospital._id), 'hospital.reset_password', 'Hospital', String(hospital._id), req);
  return res
    .status(200)
    .json({ message: 'Password reset successful. Please login again.' });
});

export default {
  listHospitals,
  registerHospital,
  loginHospital,
  refreshHospital,
  logoutHospital,
  meHospital,
  updateHospitalProfile,
  forgotHospitalPassword,
  resetHospitalPassword,
};
