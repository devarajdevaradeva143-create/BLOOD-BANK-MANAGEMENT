import { asyncHandler } from '../middleware/asyncHandler.js';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
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

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * POST /api/donors  (public — OTP gate replaces auth)
 * Body: donor fields + { code } (mobile OTP, purpose 'donor').
 */
export const createDonor = asyncHandler(async (req, res) => {
  const { mobile, code, otp, otpCode, lat, lng, ...donorData } = req.body;
  const plainCode = code ?? otp ?? otpCode;

  if (!mobile) {
    return res.status(400).json({ message: 'mobile is required' });
  }
  if (!plainCode) {
    return res.status(400).json({ message: 'OTP code is required' });
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

  const donor = await Donor.create({
    ...donorData,
    ...(districtId ? { districtId } : {}),
    ...(hasCoords
      ? { location: { type: 'Point', coordinates: [lngNum, latNum] } }
      : {}),
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

  return res.status(201).json({ message: 'Donor registered', donor });
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
    await Otp.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } });
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
  forgotDonorPassword,
  resetDonorPassword,
};
