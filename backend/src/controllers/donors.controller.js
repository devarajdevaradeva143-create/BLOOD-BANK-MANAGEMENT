import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/asyncHandler.js';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { genDonorId } from '../utils/ids.js';
import { logAudit } from '../middleware/audit.js';
import { verifyOtpInternal } from './otp.controller.js';
import { comparePassword, hashPassword } from '../utils/passwords.js';
import {
  signAccess,
  signRefresh,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/jwt.js';
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
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

/** Public-safe donor shape — never exposes passwordHash / refreshTokens. */
function toSafeDonor(d) {
  if (!d) return null;
  return {
    id: String(d._id),
    donorId: d.donorId,
    fullName: d.fullName,
    email: d.email || '',
    mobile: d.mobile,
    bloodGroup: d.bloodGroup || '',
    dob: d.dob ? new Date(d.dob).toISOString().slice(0, 10) : '',
    age: d.age ?? null,
    gender: d.gender || '',
    district: d.district || '',
    districtId: d.districtId || '',
    city: d.city || '',
    pincode: d.pincode || '',
    address: d.address || '',
    status: d.status,
    role: 'Donor',
    createdAt: d.createdAt,
  };
}

function pruneExpiredTokens(donor, max = 5) {
  const now = new Date();
  donor.refreshTokens = (donor.refreshTokens || []).filter(
    (t) => t && t.expiresAt && new Date(t.expiresAt) > now
  );
  if (donor.refreshTokens.length >= max) {
    donor.refreshTokens = donor.refreshTokens.slice(-(max - 1));
  }
}

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * POST /api/donors  (public — OTP gate replaces auth)
 * Body: donor fields + { code } (mobile OTP, purpose 'donor').
 */
export const createDonor = asyncHandler(async (req, res) => {
  const { mobile, code, otp, otpCode, lat, lng, password, ...donorData } = req.body;
  const plainCode = code ?? otp ?? otpCode;

  if (!mobile) {
    return res.status(400).json({ message: 'mobile is required' });
  }
  if (!plainCode) {
    return res.status(400).json({ message: 'OTP code is required' });
  }
  if (!password) {
    return res.status(400).json({ message: 'password is required' });
  }

  await verifyOtpInternal(String(mobile).trim(), String(plainCode).trim(), 'donor');

  const districtRaw = String(donorData.district || '').trim();
  const districtId =
    String(donorData.districtId || districtRaw).trim().toLowerCase() || undefined;
  const latNum = lat === undefined || lat === null || lat === '' ? undefined : Number(lat);
  const lngNum = lng === undefined || lng === null || lng === '' ? undefined : Number(lng);
  const hasCoords =
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180;

  const normalizedEmail = String(donorData.email || '').trim().toLowerCase();
  const emailTaken = normalizedEmail
    ? await Donor.exists({ email: normalizedEmail })
    : false;
  if (emailTaken) {
    return res
      .status(409)
      .json({ message: 'An account with this email already exists' });
  }

  const donor = await Donor.create({
    ...donorData,
    ...(districtId ? { districtId } : {}),
    ...(hasCoords
      ? { location: { type: 'Point', coordinates: [lngNum, latNum] } }
      : {}),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    mobile: String(mobile).trim(),
    donorId: genDonorId(),
    mobileVerified: true,
  }).catch((err) => {
    if (err?.code === 11000) {
      const e = new Error('Donor already exists');
      e.statusCode = 409;
      throw e;
    }
    throw err;
  });

  logAudit(null, 'donor.create', 'Donor', donor.donorId, req, {
    mobile: donor.mobile,
  });

  return res.status(201).json({ message: 'Donor registered', donor: toSafeDonor(donor) });
});

/**
 * GET /api/donors  (auth required at route level)
 * Query: ?bloodGroup=&district=&search=&page=&limit=
 * DistrictAdmin-ku avanga district donor mattum (query-va override panni
 * force pannuvom) — JWT-first + DB fallback via User.findById.
 * NOTE / LIMITATION: Donor.district is free text (no slug column), so the
 * forced filter is an exact case-insensitive match on the admin's district
 * slug. Display names that differ from the slug (e.g. "Chennai District" vs
 * slug "chennai") will NOT match — public behavior otherwise unchanged.
 */
export const listDonors = asyncHandler(async (req, res) => {
  const { bloodGroup, district, districtId, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;

  let adminDistrict = String(req.user?.districtId || '').trim().toLowerCase();
  if (!adminDistrict && req.user?.id && req.user?.role !== 'Hospital') {
    try {
      const me = await User.findById(req.user.id).select('districtId').lean();
      adminDistrict = String(me?.districtId || '').trim().toLowerCase();
    } catch {
      adminDistrict = '';
    }
  }
  // DistrictAdmin-ku district illana fail-closed — ella district-um kaata koodadhu.
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }
  if (req.user?.role === 'DistrictAdmin' && adminDistrict) {
    filter.district = new RegExp(`^${escapeRegex(adminDistrict)}$`, 'i');
  } else if (districtId || district) {
    filter.district = new RegExp(`^${escapeRegex(String(districtId || district).trim())}$`, 'i');
  }
  if (search) {
    const q = escapeRegex(String(search).trim());
    filter.$or = [
      { fullName: new RegExp(q, 'i') },
      { donorId: new RegExp(q, 'i') },
      { mobile: new RegExp(q, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    Donor.find(filter)
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
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
 * stores the bcrypt hash. When no Donor exists the OTP still validates
 * (generic flow) but nothing is written; the response stays identical.
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
    await Otp.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } });
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  doc.consumed = true;
  await doc.save();

  const donor = await Donor.findOne({ email });
  if (donor) {
    donor.passwordHash = await hashPassword(newPassword);
    // Password change revokes every existing session.
    donor.refreshTokens = [];
    await donor.save();
    logAudit(null, 'donor.reset_password', 'Donor', donor.donorId, req);
  } else {
    logAudit(null, 'donor.reset_password', 'Donor', email, req);
  }
  return res
    .status(200)
    .json({ message: 'Password reset successful. Please login again.' });
});

/**
 * POST /api/donors/login
 * Body: { email, password } — real donor account (Donor-Frontend).
 * Issues an access JWT + rotating httpOnly refresh cookie.
 */
export const loginDonor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const donor = await Donor.findOne({ email: normalizedEmail }).select(
    '+passwordHash'
  );
  if (!donor || !donor.passwordHash) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const ok = await comparePassword(password, donor.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const accessToken = signAccess({ _id: donor._id, role: 'Donor' });
  const refreshToken = signRefresh({ _id: donor._id, role: 'Donor' });

  pruneExpiredTokens(donor);
  donor.refreshTokens.push({
    tokenHash: hashValue(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
  });
  await donor.save();

  setRefreshCookie(res, refreshToken);
  logAudit(String(donor._id), 'donor.login', 'Donor', donor.donorId, req);
  return res.status(200).json({ user: toSafeDonor(donor), accessToken });
});

/**
 * POST /api/donors/refresh — rotates the refresh cookie, returns a new
 * access token (and a fresh profile so the client stays in sync).
 */
export const refreshDonor = asyncHandler(async (req, res) => {
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
  if (payload.role !== 'Donor') {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const tokenHash = hashValue(token);
  const donor = await Donor.findOne({
    _id: payload.id,
    'refreshTokens.tokenHash': tokenHash,
  });
  if (!donor) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  donor.refreshTokens = (donor.refreshTokens || []).filter(
    (t) => t.tokenHash !== tokenHash && new Date(t.expiresAt) > new Date()
  );

  const accessToken = signAccess({ _id: donor._id, role: 'Donor' });
  const refreshToken = signRefresh({ _id: donor._id, role: 'Donor' });
  pruneExpiredTokens(donor);
  donor.refreshTokens.push({
    tokenHash: hashValue(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_EXPIRES_MS),
  });
  await donor.save();

  setRefreshCookie(res, refreshToken);
  return res.status(200).json({ user: toSafeDonor(donor), accessToken });
});

/**
 * POST /api/donors/logout — clears cookie + drops the presented session.
 */
export const logoutDonor = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret);
      await Donor.updateOne(
        { _id: payload.id },
        { $pull: { refreshTokens: { tokenHash: hashValue(token) } } }
      );
    } catch {
      try {
        await Donor.updateMany(
          { 'refreshTokens.tokenHash': hashValue(token) },
          { $pull: { refreshTokens: { tokenHash: hashValue(token) } } }
        );
      } catch {
        // ignore — cookie is cleared regardless
      }
    }
  }

  clearRefreshCookie(res);
  return res.status(200).json({ message: 'Logged out' });
});

/**
 * GET /api/donors/me — current donor profile (auth required, Donor only).
 */
export const meDonor = asyncHandler(async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.user?.role !== 'Donor') {
    return res.status(403).json({ message: 'Donor account required' });
  }
  const donor = await Donor.findById(req.user.id).select(
    '-passwordHash -refreshTokens'
  );
  if (!donor) {
    return res.status(404).json({ message: 'Donor not found' });
  }
  return res.status(200).json({ user: toSafeDonor(donor) });
});

/**
 * GET /api/donors/map (auth required)
 * DistrictAdmin-ku avanga district donors mattum — map dots + trip planning ku.
 * Query: ?bloodGroup=&district=&districtId=&limit= (max 500, default 200)
 * Returns lightweight rows with address + location.
 */
export const listDonorMap = asyncHandler(async (req, res) => {
  const { bloodGroup, district, districtId } = req.query;
  const limit = Math.min(
    500,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 200)
  );

  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;

  let adminDistrict = String(req.user?.districtId || '').trim().toLowerCase();
  if (!adminDistrict && req.user?.id && req.user?.role !== 'Hospital') {
    try {
      const me = await User.findById(req.user.id).select('districtId').lean();
      adminDistrict = String(me?.districtId || '').trim().toLowerCase();
    } catch {
      adminDistrict = '';
    }
  }
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }
  if (req.user?.role === 'DistrictAdmin' && adminDistrict) {
    filter.$or = [
      { districtId: new RegExp(`^${escapeRegex(adminDistrict)}$`, 'i') },
      {
        districtId: { $in: [null, ''] },
        district: new RegExp(`^${escapeRegex(adminDistrict)}$`, 'i'),
      },
    ];
  } else if (districtId || district) {
    const slug = String(districtId || district).trim();
    filter.$or = [
      { districtId: new RegExp(`^${escapeRegex(slug)}$`, 'i') },
      {
        districtId: { $in: [null, ''] },
        district: new RegExp(`^${escapeRegex(slug)}$`, 'i'),
      },
    ];
  }

  const docs = await Donor.find(filter)
    .select('donorId fullName bloodGroup mobile district districtId city pincode address status location')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const data = docs.map((d) => {
    const coords = Array.isArray(d.location?.coordinates) ? d.location.coordinates : null;
    return {
      donorId: d.donorId,
      fullName: d.fullName,
      bloodGroup: d.bloodGroup,
      mobile: d.mobile,
      district: d.district,
      districtId: d.districtId,
      city: d.city,
      pincode: d.pincode,
      address: d.address,
      status: d.status,
      lat: coords && Number.isFinite(coords[1]) ? coords[1] : null,
      lng: coords && Number.isFinite(coords[0]) ? coords[0] : null,
    };
  });

  return res.status(200).json({ data, total: data.length, limit });
});

export default {
  createDonor,
  listDonors,
  listDonorMap,
  loginDonor,
  refreshDonor,
  logoutDonor,
  meDonor,
  forgotDonorPassword,
  resetDonorPassword,
};
