import { asyncHandler } from '../middleware/asyncHandler.js';
import BloodRequest from '../models/BloodRequest.js';
import User from '../models/User.js';
import { genRequestId } from '../utils/ids.js';
import { logAudit } from '../middleware/audit.js';
import { verifyOtpInternal } from './otp.controller.js';

const TRANSITIONS = {
  submitted: ['approved', 'cancelled'],
  approved: ['fulfilled', 'cancelled'],
  fulfilled: [],
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

async function findRequestByIdOrRequestId(id) {
  const key = String(id || '').trim();
  let doc = await BloodRequest.findOne({ requestId: key });
  if (!doc) {
    try {
      doc = await BloodRequest.findById(key);
    } catch {
      doc = null;
    }
  }
  return doc;
}

/**
 * POST /api/requests  (public — OTP gate replaces auth)
 * Body: request fields + { code } (contact OTP, purpose 'request').
 */
export const createRequest = asyncHandler(async (req, res) => {
  const { contact, code, otp, otpCode, ...requestData } = req.body;
  const plainCode = code ?? otp ?? otpCode;

  if (!contact) {
    return res.status(400).json({ message: 'contact is required' });
  }
  if (!plainCode) {
    return res.status(400).json({ message: 'OTP code is required' });
  }

  await verifyOtpInternal(String(contact).trim(), String(plainCode).trim(), 'request');

  const doc = await BloodRequest.create({
    ...requestData,
    contact: String(contact).trim(),
    requestId: genRequestId(),
    contactVerified: true,
  });

  logAudit(null, 'request.create', 'BloodRequest', doc.requestId, req, {
    bloodGroup: doc.bloodGroup,
    units: doc.units,
  });

  return res.status(201).json({ message: 'Request submitted', request: doc });
});

/**
 * GET /api/requests  (auth required at route level)
 * Query: ?bloodGroup=&districtId=&status=&search=&page=&limit=
 * District scope: admin-ku districtId irundha andha district request mattum
 * dhaan theriyum (query-va override panni force pannuvom).
 */
export const listRequests = asyncHandler(async (req, res) => {
  const { bloodGroup, districtId, district, status, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  // Admin district-ah DB-la irundhu resolve pannu (JWT-ah namba vendaam).
  let adminDistrict = String(req.user?.districtId || '').trim().toLowerCase();
  if (!adminDistrict && req.user?.id) {
    try {
      const me = await User.findById(req.user.id).select('districtId').lean();
      adminDistrict = String(me?.districtId || '').trim().toLowerCase();
    } catch {
      adminDistrict = '';
    }
  }

  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (adminDistrict) {
    // District admin-ku avanga district mattum — vera district patha mudiyadhu.
    filter.districtId = adminDistrict;
  } else if (districtId || district) {
    filter.districtId = districtId || district;
  }
  if (status) filter.status = status;
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { patientName: new RegExp(q, 'i') },
      { requestId: new RegExp(q, 'i') },
      { hospitalName: new RegExp(q, 'i') },
      { contact: new RegExp(q, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    BloodRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BloodRequest.countDocuments(filter),
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
 * PATCH /api/requests/:id/status  (Doctor only at route level)
 * Body: { status } — validated by requestStatusSchema.
 */
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const doc = await findRequestByIdOrRequestId(id);
  if (!doc) {
    return res.status(404).json({ message: 'Request not found' });
  }

  // Vera district request-ah approve panna mudiyadhu.
  let adminDistrict = String(req.user?.districtId || '').trim().toLowerCase();
  if (!adminDistrict && req.user?.id) {
    try {
      const me = await User.findById(req.user.id).select('districtId').lean();
      adminDistrict = String(me?.districtId || '').trim().toLowerCase();
    } catch {
      adminDistrict = '';
    }
  }
  if (
    adminDistrict &&
    String(doc.districtId || '').trim().toLowerCase() !== adminDistrict
  ) {
    return res
      .status(403)
      .json({ message: 'Forbidden: request belongs to another district' });
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

  logAudit(req.user?.id || null, 'request.status', 'BloodRequest', doc.requestId, req, {
    from,
    to: status,
  });

  return res.status(200).json({ message: 'Request status updated', request: doc });
});

export default { createRequest, listRequests, updateRequestStatus };
