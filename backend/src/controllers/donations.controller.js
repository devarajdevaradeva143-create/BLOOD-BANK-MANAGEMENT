import { asyncHandler } from '../middleware/asyncHandler.js';
import Donation from '../models/Donation.js';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
import { genDonationId } from '../utils/ids.js';
import { notify } from '../services/notifications.service.js';
import { logAudit } from '../middleware/audit.js';
import { verifyOtpInternal } from './otp.controller.js';

const TRANSITIONS = {
  pending: ['approved', 'cancelled'],
  approved: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

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

async function findDonationByIdOrDonationId(id) {
  const key = String(id || '').trim();
  let doc = await Donation.findOne({ donationId: key });
  if (!doc) {
    try {
      doc = await Donation.findById(key);
    } catch {
      doc = null;
    }
  }
  return doc;
}

/**
 * POST /api/donations  (public — OTP gate replaces auth)
 * Body: donation fields + { code } (mobile OTP, purpose 'donation').
 */
export const createDonation = asyncHandler(async (req, res) => {
  const { mobile, code, otp, otpCode, districtId, ...donationData } = req.body;
  const plainCode = code ?? otp ?? otpCode;

  if (!mobile) {
    return res.status(400).json({ message: 'mobile is required' });
  }
  if (!plainCode) {
    return res.status(400).json({ message: 'OTP code is required' });
  }

  await verifyOtpInternal(String(mobile).trim(), String(plainCode).trim(), 'donation');

  const doc = await Donation.create({
    ...donationData,
    mobile: String(mobile).trim(),
    districtId: String(districtId || '').trim().toLowerCase(),
    donationId: genDonationId(),
    contactVerified: true,
  });

  logAudit(null, 'donation.create', 'Donation', doc.donationId, req, {
    bloodGroup: doc.bloodGroup,
    districtId: doc.districtId,
  });

  try {
    await notify({
      audience: 'district',
      districtId: doc.districtId,
      type: 'donation',
      title: `New donation request: ${doc.donorName} (${doc.bloodGroup})`,
      link: '/donations',
    });
  } catch {
    // best-effort — never break the main request
  }

  return res.status(201).json({ message: 'Donation submitted', donation: doc });
});

/**
 * GET /api/donations  (auth required at route level)
 * Query: ?bloodGroup=&districtId=&district=&status=&search=&page=&limit=
 * District scope: admin sees only donations from their assigned district
 * (can override via query param to force a different district).
 * Hospital role: sees only their own donations (hospitalId filter).
 */
export const listDonations = asyncHandler(async (req, res) => {
  const { bloodGroup, districtId, district, status, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  // Resolve admin district from DB (don't trust JWT).
  let adminDistrict = String(req.user?.districtId || '').trim().toLowerCase();
  if (!adminDistrict && req.user?.id && req.user?.role !== 'Hospital') {
    try {
      const me = await User.findById(req.user.id).select('districtId').lean();
      adminDistrict = String(me?.districtId || '').trim().toLowerCase();
    } catch {
      adminDistrict = '';
    }
  }

  // DistrictAdmin without district fails closed — cannot see any district.
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (req.user?.role === 'Hospital' && req.user?.id) {
    // Hospital-ku sodha hospital donation mattum — vera hospital patha mudiyadhu.
    filter.hospitalId = String(req.user.id);
  } else if (adminDistrict) {
    // District admin-ku avanga district mattum — vera district patha mudiyadhu.
    filter.districtId = adminDistrict;
  } else if (districtId || district) {
    filter.districtId = String(districtId || district).trim().toLowerCase();
  }
  if (status) filter.status = status;
  if (search) {
    const q = escapeRegex(String(search).trim());
    filter.$or = [
      { donorName: new RegExp(q, 'i') },
      { donationId: new RegExp(q, 'i') },
      { mobile: new RegExp(q, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    Donation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Donation.countDocuments(filter),
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
 * PATCH /api/donations/:id/status
 * DistrictAdmin/SuperAdmin (route level): pending -> approved|cancelled,
 * approved -> completed|cancelled; terminal states reject. Cross-district 403.
 * Body: { status } — validated by donationStatusSchema.
 */
export const updateDonationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const doc = await findDonationByIdOrDonationId(id);
  if (!doc) {
    return res.status(404).json({ message: 'Donation not found' });
  }

  // Vera district donation-ah approve panna mudiyadhu.
  let adminDistrict = String(req.user?.districtId || '').trim().toLowerCase();
  if (!adminDistrict && req.user?.id) {
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
  if (
    adminDistrict &&
    String(doc.districtId || '').trim().toLowerCase() !== adminDistrict
  ) {
    return res
      .status(403)
      .json({ message: 'Forbidden: donation belongs to another district' });
  }

  const from = doc.status;
  const allowed = TRANSITIONS[from] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      message: `Invalid status transition: ${from} -> ${status}`,
    });
  }

  doc.status = status;
  await doc.save();

  logAudit(req.user?.id || null, 'donation.status', 'Donation', doc.donationId, req, {
    from,
    to: status,
  });

  try {
    let donor = null;
    try {
      const mobile = String(doc.mobile || '').trim();
      if (mobile) donor = await Donor.findOne({ mobile });
      const docEmail = String(doc.email || '').trim().toLowerCase();
      if (!donor && docEmail) donor = await Donor.findOne({ email: docEmail });
    } catch {
      donor = null;
    }
    if (donor) {
      const titles = {
        approved: `Donation approved: ${doc.donationId}`,
        completed: 'Donation completed — thank you!',
        cancelled: `Donation request cancelled: ${doc.donationId}`,
      };
      const rawDate = doc.availableDate;
      let dateStr = '';
      try {
        dateStr =
          rawDate instanceof Date
            ? rawDate.toISOString().slice(0, 10)
            : String(rawDate || '').trim();
      } catch {
        dateStr = String(rawDate || '');
      }
      await notify({
        audience: 'donor',
        recipientId: String(donor._id),
        districtId: doc.districtId,
        type: 'donation',
        title: titles[status] || `Donation update: ${doc.donationId}`,
        body: `${doc.bloodGroup || ''} • ${dateStr}`.trim(),
        link: '/profile',
      });
    }
  } catch {
    // best-effort — never break the main request
  }

  return res.status(200).json({ message: 'Donation status updated', donation: doc });
});

export default { createDonation, listDonations, updateDonationStatus };
