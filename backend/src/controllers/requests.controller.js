import { asyncHandler } from '../middleware/asyncHandler.js';
import BloodRequest from '../models/BloodRequest.js';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import { genGroupId, genRequestId } from '../utils/ids.js';
import { notify } from '../services/notifications.service.js';
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

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function requestStatusTitle(status, requestId) {
  switch (status) {
    case 'approved':
      return `Request approved: ${requestId}`;
    case 'fulfilled':
    case 'completed':
      return `Request fulfilled: ${requestId}`;
    case 'cancelled':
      return `Request cancelled: ${requestId}`;
    case 'rejected':
      return `Request rejected: ${requestId}`;
    default:
      return `Request update: ${requestId}`;
  }
}

async function notifyHospitalOfRequest(doc, status) {
  try {
    if (!doc.hospitalId) return;
    await notify({
      audience: 'hospital',
      recipientId: String(doc.hospitalId),
      districtId: doc.districtId,
      type: 'request',
      title: requestStatusTitle(status, doc.requestId),
      link: '/hospital/history',
    });
  } catch {
    // best-effort — never break the main request
  }
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
    districtId: String(requestData.districtId || '').trim().toLowerCase(),
    contact: String(contact).trim(),
    requestId: genRequestId(),
    contactVerified: true,
  });

  logAudit(null, 'request.create', 'BloodRequest', doc.requestId, req, {
    bloodGroup: doc.bloodGroup,
    units: doc.units,
  });

  try {
    await notify({
      audience: 'district',
      districtId: doc.districtId,
      type: 'request',
      title: `New blood request: ${doc.bloodGroup} at ${doc.hospitalName}`,
      link: '/requests',
    });
  } catch {
    // best-effort — never break the main request
  }

  return res.status(201).json({ message: 'Request submitted', request: doc });
});

/**
 * POST /api/requests/bulk  (Hospital role + OTP gate)
 * Body: bulk envelope + { code } (contact OTP, purpose 'request') + patients[].
 * One BloodRequest per patient, all sharing a groupId (BR-YYYY-XXXXXX).
 */
export const createBulkRequests = asyncHandler(async (req, res) => {
  const {
    contact,
    code,
    otp,
    otpCode,
    requestType,
    priority,
    districtId,
    requiredDate,
    requiredTime,
    hospitalName,
    hospitalAddress,
    doctor,
    patients,
  } = req.body;
  const plainCode = code ?? otp ?? otpCode;

  if (!contact) {
    return res.status(400).json({ message: 'contact is required' });
  }
  if (!plainCode) {
    return res.status(400).json({ message: 'OTP code is required' });
  }

  await verifyOtpInternal(String(contact).trim(), String(plainCode).trim(), 'request');

  // Frontend categories (emergency|routine|surgery|icu) normalize to
  // emergency|normal for routing; the original is kept as `category`.
  const normalizedType = requestType === 'emergency' ? 'emergency' : 'normal';
  const groupId = genGroupId();
  const hospitalId = String(req.user?.id || '');
  const district = String(districtId || '').trim().toLowerCase();

  const docs = patients.map((p) => ({
    requestId: genRequestId(),
    groupId,
    hospitalId,
    patientName: String(p.name || '').trim(),
    patientAge: p.age,
    gender: p.gender,
    bloodGroup: p.bloodGroup,
    units: p.units,
    component: String(p.component || '').trim(),
    ward: String(p.ward || '').trim(),
    reason: String(p.diagnosis || '').trim(),
    requiredDate,
    requiredTime: String(requiredTime || '').trim(),
    districtId: district,
    hospitalName: String(hospitalName || '').trim(),
    hospitalAddress: String(hospitalAddress || '').trim(),
    contact: String(contact).trim(),
    contactVerified: true,
    requestType: normalizedType,
    category: String(requestType || '').trim(),
    priority: priority || 'normal',
    doctorName: String(doctor?.name || '').trim(),
    doctorId: String(doctor?.id || '').trim(),
    doctorDepartment: String(doctor?.department || '').trim(),
    doctorContact: String(doctor?.contact || '').trim(),
    status: 'submitted',
  }));

  const created = await BloodRequest.insertMany(docs);

  logAudit(hospitalId || null, 'request.bulk_create', 'BloodRequest', groupId, req, {
    patients: created.length,
    districtId: district,
  });

  return res.status(201).json({
    message: 'Blood request submitted',
    groupId,
    requests: created,
  });
});

/**
 * GET /api/requests  (auth required at route level)
 * Query: ?bloodGroup=&districtId=&status=&search=&page=&limit=
 * District scope: admin sees only requests from their assigned district
 * (can override via query param to force a different district).
 * Hospital role: sees only their own requests (hospitalId filter).
 */
export const listRequests = asyncHandler(async (req, res) => {
  const { bloodGroup, districtId, district, status, search, requestType, groupId } = req.query;
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
  if (requestType) filter.requestType = requestType;
  if (groupId) filter.groupId = String(groupId).trim();
  if (req.user?.role === 'Hospital' && req.user?.id) {
    // Hospital sees only their own requests — cannot see other hospitals.
    filter.hospitalId = String(req.user.id);
  } else if (adminDistrict) {
    // District admin sees only their own district — cannot see other districts.
    filter.districtId = adminDistrict;
  } else if (districtId || district) {
    filter.districtId = String(districtId || district).trim().toLowerCase();
  }
  if (status) filter.status = status;
  if (search) {
    const q = escapeRegex(String(search).trim());
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
 * PATCH /api/requests/:id/status
 * DistrictAdmin/SuperAdmin: full transitions (route level) + cross-district block.
 * Hospital: can only cancel their own submitted requests.
 * Body: { status } — validated by requestStatusSchema.
 */
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const doc = await findRequestByIdOrRequestId(id);
  if (!doc) {
    return res.status(404).json({ message: 'Request not found' });
  }

  // Hospital can only cancel their own requests that are in submitted status.
  if (req.user?.role === 'Hospital') {
    if (String(doc.hospitalId || '') !== String(req.user?.id || '')) {
      return res.status(403).json({ message: 'Forbidden: request belongs to another hospital' });
    }
    if (doc.status !== 'submitted' || status !== 'cancelled') {
      return res.status(400).json({
        message: 'Hospitals can only cancel their own submitted requests',
      });
    }
    doc.status = 'cancelled';
    await doc.save();
    logAudit(req.user?.id || null, 'request.status', 'BloodRequest', doc.requestId, req, {
      from: 'submitted',
      to: 'cancelled',
    });
    await notifyHospitalOfRequest(doc, 'cancelled');
    return res.status(200).json({ message: 'Request cancelled', request: doc });
  }

  // Cannot approve requests from other districts.
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

  await notifyHospitalOfRequest(doc, status);

  return res.status(200).json({ message: 'Request status updated', request: doc });
});

export default { createRequest, createBulkRequests, listRequests, updateRequestStatus };
