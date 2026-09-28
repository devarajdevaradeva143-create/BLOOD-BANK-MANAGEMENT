import { asyncHandler } from '../middleware/asyncHandler.js';
import BloodUnit from '../models/BloodUnit.js';
import User from '../models/User.js';
import { genUnitCode } from '../utils/ids.js';
import { logAudit } from '../middleware/audit.js';

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );
  return { page, limit, skip: (page - 1) * limit };
}

async function findUnitByIdOrCode(id) {
  const key = String(id || '').trim();
  let unit = await BloodUnit.findOne({ unitCode: key });
  if (!unit) {
    try {
      unit = await BloodUnit.findById(key);
    } catch {
      unit = null;
    }
  }
  return unit;
}

function actor(req) {
  return req.user?.id || req.user?.staffId || null;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactCaseInsensitive(s) {
  return new RegExp(`^${escapeRegExp(String(s).trim())}$`, 'i');
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
 * GET /api/units (auth required at route level)
 * Query: ?bloodGroup=&district=&districtId=&status=&component=&testStatus=
 *   &expiryBefore=&expiryAfter=&search=&page=&limit=
 * District scope: DistrictAdmin is forced to own district (fail-closed 403
 * if missing). `districtId` is an alias of `district` (exact,
 * case-insensitive). Backwards compat: plain `?district=` still works.
 */
export const listUnits = asyncHandler(async (req, res) => {
  const {
    bloodGroup,
    district,
    districtId,
    status,
    component,
    search,
    testStatus,
    expiryBefore,
    expiryAfter,
  } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const adminDistrict = await resolveAdminDistrict(req);
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  const filter = {};
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (req.user?.role === 'DistrictAdmin') {
    filter.district = exactCaseInsensitive(adminDistrict);
  } else {
    const d = districtId || district;
    if (d) filter.district = exactCaseInsensitive(d);
  }
  if (status) filter.status = status;
  if (component) filter.component = component;
  if (testStatus) filter.testStatus = testStatus;
  if (expiryBefore || expiryAfter) {
    filter.expiryDate = {};
    if (expiryBefore) {
      const dt = new Date(expiryBefore);
      if (!Number.isNaN(dt.getTime())) filter.expiryDate.$lte = dt;
    }
    if (expiryAfter) {
      const dt = new Date(expiryAfter);
      if (!Number.isNaN(dt.getTime())) filter.expiryDate.$gte = dt;
    }
    if (Object.keys(filter.expiryDate).length === 0) delete filter.expiryDate;
  }
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { unitCode: new RegExp(q, 'i') },
      { storageLocation: new RegExp(q, 'i') },
      { collectionStaff: new RegExp(q, 'i') },
    ];
  }

  const [data, total] = await Promise.all([
    BloodUnit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BloodUnit.countDocuments(filter),
  ]);

  return res.status(200).json({
    data,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * GET /api/units/summary (auth required at route level)
 * District-scoped stock summary. DistrictAdmin is forced to own district
 * (fail-closed 403 if missing); others may pass ?districtId= / ?district=.
 * Returns { district, byBloodGroup, byStatus, byTestStatus, expired,
 *   expiringSoon, total }.
 */
export const unitsSummary = asyncHandler(async (req, res) => {
  const adminDistrict = await resolveAdminDistrict(req);
  if (req.user?.role === 'DistrictAdmin' && !adminDistrict) {
    return res.status(403).json({ message: 'Forbidden: district not assigned' });
  }

  let district = '';
  if (req.user?.role === 'DistrictAdmin') {
    district = adminDistrict;
  } else {
    const q = req.query.districtId || req.query.district || adminDistrict;
    district = String(q || '').trim().toLowerCase();
  }

  const baseMatch = district ? { district: exactCaseInsensitive(district) } : {};
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const in30d = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [total, byStatusAgg, byTestAgg, byGroupAgg, expired, expiringSoon] =
    await Promise.all([
      BloodUnit.countDocuments(baseMatch),
      BloodUnit.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      BloodUnit.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$testStatus', count: { $sum: 1 } } },
      ]),
      BloodUnit.aggregate([
        { $match: { ...baseMatch, status: 'Available' } },
        { $group: { _id: '$bloodGroup', quantity: { $sum: '$quantity' } } },
      ]),
      BloodUnit.countDocuments({ ...baseMatch, expiryDate: { $lt: today } }),
      BloodUnit.countDocuments({
        ...baseMatch,
        expiryDate: { $gte: today, $lte: in30d },
      }),
    ]);

  const byStatus = {};
  for (const r of byStatusAgg) {
    if (r._id) byStatus[r._id] = r.count;
  }
  const byTestStatus = {};
  for (const r of byTestAgg) {
    if (r._id) byTestStatus[r._id] = r.count;
  }
  const byBloodGroup = {};
  for (const g of BLOOD_GROUPS) byBloodGroup[g] = 0;
  for (const r of byGroupAgg) {
    if (r._id && byBloodGroup[r._id] !== undefined) byBloodGroup[r._id] = r.quantity || 0;
  }

  return res.status(200).json({
    district,
    byBloodGroup,
    byStatus,
    byTestStatus,
    expired,
    expiringSoon,
    total,
  });
});

/**
 * POST /api/units (auth DistrictAdmin/SuperAdmin at route level)
 * Defaults: status UnderTesting, testStatus Pending, history `registered`.
 */
export const createUnit = asyncHandler(async (req, res) => {
  const unit = await BloodUnit.create({
    ...req.body,
    unitCode: req.body.unitCode || genUnitCode(),
    status: req.body.status || 'UnderTesting',
    testStatus: req.body.testStatus || 'Pending',
    history: [
      {
        type: 'registered',
        at: new Date(),
        byUser: actor(req),
        status: req.body.status || 'UnderTesting',
        note: 'Unit registered',
      },
    ],
  });

  logAudit(actor(req), 'unit.create', 'BloodUnit', unit.unitCode, req, {
    bloodGroup: unit.bloodGroup,
    component: unit.component,
  });

  return res.status(201).json({ message: 'Unit registered', unit });
});

/**
 * PATCH /api/units/:id/status (auth at route level)
 * Body: { status } — validated by unitStatusSchema.
 */
export const updateUnitStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const unit = await findUnitByIdOrCode(id);
  if (!unit) {
    return res.status(404).json({ message: 'Unit not found' });
  }

  const from = unit.status;
  unit.status = status;
  unit.history.push({
    type: 'statusUpdated',
    at: new Date(),
    byUser: actor(req),
    status,
    note: note || `Status ${from} -> ${status}`,
  });
  await unit.save();

  logAudit(actor(req), 'unit.status', 'BloodUnit', unit.unitCode, req, {
    from,
    to: status,
  });

  return res.status(200).json({ message: 'Unit status updated', unit });
});

/**
 * POST /api/units/:id/test (DistrictAdmin/SuperAdmin at route level)
 * Body: { testStatus, screeningResult, testedBy, testDate, remarks }
 * Auto status: Passed -> Available, Failed -> Discarded.
 */
export const recordTestResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { testStatus, screeningResult, testedBy, testDate, remarks } = req.body;

  const unit = await findUnitByIdOrCode(id);
  if (!unit) {
    return res.status(404).json({ message: 'Unit not found' });
  }

  unit.testStatus = testStatus;
  if (screeningResult !== undefined) unit.screeningResult = screeningResult;
  if (testedBy !== undefined) unit.testedBy = testedBy;
  if (testDate !== undefined) unit.testDate = testDate ? new Date(testDate) : unit.testDate;
  if (remarks !== undefined) unit.remarks = remarks;

  if (testStatus === 'Passed') {
    unit.status = 'Available';
  } else if (testStatus === 'Failed') {
    unit.status = 'Discarded';
  }

  unit.history.push({
    type: 'testCompleted',
    at: new Date(),
    byUser: actor(req) || testedBy || null,
    status: unit.status,
    note: `Test ${testStatus}${remarks ? `: ${remarks}` : ''}`,
  });
  await unit.save();

  logAudit(actor(req), 'unit.test', 'BloodUnit', unit.unitCode, req, {
    testStatus,
    status: unit.status,
  });

  return res.status(200).json({ message: 'Test result recorded', unit });
});

export default { listUnits, unitsSummary, createUnit, updateUnitStatus, recordTestResult };
