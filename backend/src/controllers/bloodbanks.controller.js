import crypto from 'node:crypto';
import { asyncHandler } from '../middleware/asyncHandler.js';
import BloodBank from '../models/BloodBank.js';
import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';

const ALPHA_NUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BANK_STATUSES = ['Active', 'Inactive'];

function genBankId() {
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += ALPHA_NUM[bytes[i] % ALPHA_NUM.length];
  }
  return `BB-${out}`;
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

async function resolveAdminDistrict(req) {
  let d = String(req.user?.districtId || '').trim().toLowerCase();
  if (!d && req.user?.id && req.user?.role !== 'Hospital') {
    try {
      const me = await User.findById(req.user.id).select('districtId').lean();
      d = String(me?.districtId || '').trim().toLowerCase();
    } catch {
      d = '';
    }
  }
  return d;
}

/**
 * GET /api/blood-banks (DistrictAdmin/SuperAdmin at route level)
 * Query: ?districtId=&search=&status=&page=&limit=
 * DistrictAdmin is forced to own district (fail-closed 403 if missing);
 * SuperAdmin sees all / may filter by ?districtId=.
 */
export const listBloodBanks = asyncHandler(async (req, res) => {
  const { districtId, search, status } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const adminDistrict = await resolveAdminDistrict(req);
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  const filter = {};
  if (req.user?.role === 'DistrictAdmin') {
    filter.districtId = adminDistrict;
  } else if (districtId) {
    filter.districtId = String(districtId).trim().toLowerCase();
  }
  if (status) {
    filter.status = String(status).trim();
  }
  if (search) {
    const q = escapeRegex(String(search).trim());
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { bankId: new RegExp(q, 'i') },
      { contact: new RegExp(q, 'i') },
      { address: new RegExp(q, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    BloodBank.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BloodBank.countDocuments(filter),
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
 * POST /api/blood-banks (SuperAdmin only at route level)
 * Body: { name, district?, districtId?, contact?, address?, status?, bankId? }
 * bankId is auto-generated when omitted.
 */
export const createBloodBank = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const status = req.body?.status ? String(req.body.status).trim() : 'Active';
  if (!BANK_STATUSES.includes(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${BANK_STATUSES.join(', ')}` });
  }

  const bankId = req.body?.bankId
    ? String(req.body.bankId).trim().toUpperCase()
    : genBankId();

  const existing = await BloodBank.findOne({ bankId });
  if (existing) {
    return res
      .status(409)
      .json({ message: 'A blood bank with this bankId already exists' });
  }

  try {
    const bank = await BloodBank.create({
      bankId,
      name,
      district: String(req.body?.district || '').trim(),
      districtId: String(req.body?.districtId || '').trim().toLowerCase(),
      contact: String(req.body?.contact || '').trim(),
      address: String(req.body?.address || '').trim(),
      status,
    });

    logAudit(req.user?.id || null, 'bank.create', 'BloodBank', bankId, req);
    return res.status(201).json({ message: 'Blood bank created', bank });
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ message: 'A blood bank with this bankId already exists' });
    }
    throw err;
  }
});

/**
 * PATCH /api/blood-banks/:id (SuperAdmin only at route level)
 * Body: { name?, district?, districtId?, contact?, address?, status? }
 */
export const updateBloodBank = asyncHandler(async (req, res) => {
  const bank = await BloodBank.findById(req.params.id);
  if (!bank) {
    return res.status(404).json({ message: 'Blood bank not found' });
  }

  const { name, district, districtId, contact, address, status } =
    req.body || {};

  if (name !== undefined) {
    const clean = String(name).trim();
    if (!clean) {
      return res.status(400).json({ message: 'name must not be empty' });
    }
    bank.name = clean;
  }
  if (district !== undefined) bank.district = String(district || '').trim();
  if (districtId !== undefined) {
    bank.districtId = String(districtId || '').trim().toLowerCase();
  }
  if (contact !== undefined) bank.contact = String(contact || '').trim();
  if (address !== undefined) bank.address = String(address || '').trim();
  if (status !== undefined) {
    const clean = String(status).trim();
    if (!BANK_STATUSES.includes(clean)) {
      return res
        .status(400)
        .json({ message: `status must be one of: ${BANK_STATUSES.join(', ')}` });
    }
    bank.status = clean;
  }

  await bank.save();
  logAudit(
    req.user?.id || null,
    'bank.update',
    'BloodBank',
    bank.bankId,
    req
  );

  return res.status(200).json({ message: 'Blood bank updated', bank });
});

export default { listBloodBanks, createBloodBank, updateBloodBank };
